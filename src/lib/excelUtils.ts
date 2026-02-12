import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MemberExport {
  'First Name': string;
  'Last Name': string;
  Gender: string;
  Mobile: string;
  DOB: string;
  Status: string;
  Address: string;
  Type: string;
  Suburb: string;
  'First Visit': string;
  'Attendance Count': number;
  'Flag Count': number;
}

interface AttendanceExport {
  'Member Name': string;
  'Event Date': string;
  'Checked In At': string;
}

export async function exportToExcel() {
  try {
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*, neighborhood:neighborhoods(name)')
      .order('name');

    if (membersError) throw membersError;

    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*, member:members(name)')
      .order('event_date', { ascending: false });

    if (attendanceError) throw attendanceError;

    const membersSheet: MemberExport[] = members.map((m: any) => ({
      'First Name': m.first_name || '',
      'Last Name': m.last_name || '',
      Gender: m.gender || '',
      Mobile: m.phone || '',
      DOB: m.dob || '',
      Status: m.status || '',
      Address: m.address || '',
      Type: m.type,
      Suburb: m.neighborhood?.name || '',
      'First Visit': m.first_visit,
      'Attendance Count': m.attendance_count,
      'Flag Count': m.flag_count,
    }));

    const attendanceSheet: AttendanceExport[] = attendance.map((a: any) => ({
      'Member Name': a.member?.name || 'Unknown',
      'Event Date': a.event_date,
      'Checked In At': a.checked_in_at,
    }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(membersSheet);
    const ws2 = XLSX.utils.json_to_sheet(attendanceSheet);

    ws1['!cols'] = [
      { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 15 }, { wch: 12 },
      { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 20 }, { wch: 12 },
      { wch: 16 }, { wch: 10 },
    ];
    ws2['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 22 }];

    XLSX.utils.book_append_sheet(wb, ws1, 'Members');
    XLSX.utils.book_append_sheet(wb, ws2, 'Attendance');

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `youth-checkin-${today}.xlsx`);
    toast.success('Excel file downloaded!');
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Failed to export data');
  }
}

interface ImportRow {
  'First Name'?: string;
  'first name'?: string;
  FirstName?: string;
  firstname?: string;
  'Last Name'?: string;
  'last name'?: string;
  LastName?: string;
  lastname?: string;
  Name?: string;
  name?: string;
  Gender?: string;
  gender?: string;
  Mobile?: string;
  mobile?: string;
  Phone?: string;
  phone?: string;
  DOB?: string;
  dob?: string;
  Status?: string;
  status?: string;
  Address?: string;
  address?: string;
  Type?: string;
  type?: string;
  Suburb?: string;
  suburb?: string;
  Neighborhood?: string;
  neighborhood?: string;
}

export async function importFromExcel(
  file: File,
  existingNeighborhoods: { id: string; name: string }[],
  addNeighborhood: (name: string) => Promise<{ id: string; name: string } | null>,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });

        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: ImportRow[] = XLSX.utils.sheet_to_json(ws);

        if (rows.length === 0) {
          toast.error('No data found in the file');
          resolve(0);
          return;
        }

        const neighborhoodMap = new Map<string, string>();
        for (const n of existingNeighborhoods) {
          neighborhoodMap.set(n.name.toLowerCase(), n.id);
        }

        let added = 0;
        let skipped = 0;

        for (const row of rows) {
          const firstName = (row['First Name'] || row['first name'] || row.FirstName || row.firstname || '').toString().trim();
          const lastName = (row['Last Name'] || row['last name'] || row.LastName || row.lastname || '').toString().trim();
          const legacyName = (row.Name || row.name || '').toString().trim();
          
          const finalFirstName = firstName || (legacyName ? legacyName.split(' ')[0] : '');
          const finalLastName = lastName || (legacyName ? legacyName.split(' ').slice(1).join(' ') : '');
          
          if (!finalFirstName) {
            skipped++;
            continue;
          }

          const phone = (row.Mobile || row.mobile || row.Phone || row.phone || '').toString().trim();
          const gender = (row.Gender || row.gender || '').toString().trim().toLowerCase();
          const dob = (row.DOB || row.dob || '').toString().trim();
          const status = (row.Status || row.status || '').toString().trim().toLowerCase();
          const address = (row.Address || row.address || '').toString().trim();
          const type = (row.Type || row.type || 'visitor').toString().trim().toLowerCase();
          const suburbName = (row.Suburb || row.suburb || row.Neighborhood || row.neighborhood || '').toString().trim();

          let neighborhoodId: string | null = null;
          if (suburbName) {
            const existingId = neighborhoodMap.get(suburbName.toLowerCase());
            if (existingId) {
              neighborhoodId = existingId;
            } else {
              const newNeighborhood = await addNeighborhood(suburbName);
              if (newNeighborhood) {
                neighborhoodId = newNeighborhood.id;
                neighborhoodMap.set(suburbName.toLowerCase(), newNeighborhood.id);
              }
            }
          }

          const fullName = `${finalFirstName} ${finalLastName}`.trim();
          const { error } = await supabase.from('members').insert({
            name: fullName,
            first_name: finalFirstName,
            last_name: finalLastName,
            phone: phone || null,
            gender: gender || null,
            dob: dob || null,
            status: status || null,
            address: address || null,
            type: type === 'regular' ? 'regular' : 'visitor',
            neighborhood_id: neighborhoodId,
          });

          if (error) {
            console.error('Insert error for', fullName, error);
            skipped++;
          } else {
            added++;
          }
        }

        if (skipped > 0) {
          toast.info(`${skipped} row(s) were skipped`);
        }
        toast.success(`${added} member(s) imported successfully!`);
        resolve(added);
      } catch (err) {
        console.error('Import error:', err);
        toast.error('Failed to parse Excel file');
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
