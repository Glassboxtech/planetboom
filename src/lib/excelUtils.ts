import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MemberExport {
  Name: string;
  Phone: string;
  Type: string;
  Neighborhood: string;
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
    // Fetch members with neighborhoods
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*, neighborhood:neighborhoods(name)')
      .order('name');

    if (membersError) throw membersError;

    // Fetch all attendance records with member names
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*, member:members(name)')
      .order('event_date', { ascending: false });

    if (attendanceError) throw attendanceError;

    // Build members sheet
    const membersSheet: MemberExport[] = members.map((m: any) => ({
      Name: m.name,
      Phone: m.phone || '',
      Type: m.type,
      Neighborhood: m.neighborhood?.name || '',
      'First Visit': m.first_visit,
      'Attendance Count': m.attendance_count,
      'Flag Count': m.flag_count,
    }));

    // Build attendance sheet
    const attendanceSheet: AttendanceExport[] = attendance.map((a: any) => ({
      'Member Name': a.member?.name || 'Unknown',
      'Event Date': a.event_date,
      'Checked In At': a.checked_in_at,
    }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(membersSheet);
    const ws2 = XLSX.utils.json_to_sheet(attendanceSheet);

    // Set column widths
    ws1['!cols'] = [
      { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 16 }, { wch: 10 },
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
  Name?: string;
  name?: string;
  Phone?: string;
  phone?: string;
  Type?: string;
  type?: string;
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

        // Read first sheet
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: ImportRow[] = XLSX.utils.sheet_to_json(ws);

        if (rows.length === 0) {
          toast.error('No data found in the file');
          resolve(0);
          return;
        }

        // Build a map of neighborhood names to IDs
        const neighborhoodMap = new Map<string, string>();
        for (const n of existingNeighborhoods) {
          neighborhoodMap.set(n.name.toLowerCase(), n.id);
        }

        let added = 0;
        let skipped = 0;

        for (const row of rows) {
          const name = (row.Name || row.name || '').toString().trim();
          if (!name) {
            skipped++;
            continue;
          }

          const phone = (row.Phone || row.phone || '').toString().trim();
          const type = (row.Type || row.type || 'visitor').toString().trim().toLowerCase();
          const neighborhoodName = (row.Neighborhood || row.neighborhood || '').toString().trim();

          let neighborhoodId: string | null = null;
          if (neighborhoodName) {
            const existingId = neighborhoodMap.get(neighborhoodName.toLowerCase());
            if (existingId) {
              neighborhoodId = existingId;
            } else {
              // Create the neighborhood
              const newNeighborhood = await addNeighborhood(neighborhoodName);
              if (newNeighborhood) {
                neighborhoodId = newNeighborhood.id;
                neighborhoodMap.set(neighborhoodName.toLowerCase(), newNeighborhood.id);
              }
            }
          }

          const { error } = await supabase.from('members').insert({
            name,
            phone: phone || null,
            type: type === 'regular' ? 'regular' : 'visitor',
            neighborhood_id: neighborhoodId,
          });

          if (error) {
            console.error('Insert error for', name, error);
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
