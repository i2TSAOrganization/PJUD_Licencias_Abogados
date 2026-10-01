import { LicenciaPublica } from '../../interfaces/licencia';
import { nombreProfesional } from '../../interfaces/tipo-profesional';
import { fechaAr } from './fechas';

const VERDE: [number, number, number] = [13, 91, 73];
const VERDE_CLARO: [number, number, number] = [227, 239, 235];
const LOGO = 'assets/images/logo-poder-judicial.png';

async function cargarLogo(): Promise<string | null> {
  try {
    const blob = await (await fetch(LOGO)).blob();
    return await new Promise((ok) => {
      const r = new FileReader();
      r.onload = () => ok(r.result as string);
      r.onerror = () => ok(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * PDF de la consulta: logo, fecha de emisión, cantidad, filtros aplicados y tabla con los
 * campos públicos. jsPDF se carga recién al exportar para no agrandar el bundle inicial.
 */
export async function exportarLicenciasPdf(
  items: LicenciaPublica[],
  filtros: string[],
): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const hoy = new Date().toLocaleDateString('es-AR');

  const logo = await cargarLogo();
  if (logo) doc.addImage(logo, 'PNG', 14, 10, 40, 16);
  doc
    .setFontSize(15)
    .setTextColor(...VERDE)
    .text('Consulta de licencias', 14, 34);
  doc.setFontSize(9).setTextColor(93, 107, 103);
  const cantidad = `${items.length} ${items.length === 1 ? 'licencia' : 'licencias'}`;
  const textoFiltros = filtros.length ? `Filtros: ${filtros.join(' · ')}` : 'Sin filtros';
  doc.text(doc.splitTextToSize(`Emitido el ${hoy} · ${cantidad} · ${textoFiltros}`, 182), 14, 40);
  doc.text(
    'Los días son hábiles judiciales y se cuentan desde la fecha de comienzo. La fecha de fin la calcula el juzgado.',
    14,
    48,
  );

  autoTable(doc, {
    startY: 52,
    head: [
      [
        'Colegio / circunscripción',
        'Nombre',
        'Matrícula',
        'Tipo de profesional',
        'Fecha de comienzo',
        'Días hábiles',
      ],
    ],
    body: items.map((l) => [
      `${l.colegio.circunscripcion}ª · ${l.colegio.nombre}`,
      l.apellidoNombre,
      l.matricula,
      nombreProfesional(l.tipoProfesional),
      fechaAr(l.fechaComienzo),
      String(l.diasHabiles),
    ]),
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    headStyles: { fillColor: VERDE_CLARO, textColor: [10, 74, 59] },
    columnStyles: { 4: { halign: 'center' }, 5: { halign: 'center' } },
  });

  doc.save(`consulta_licencias_${hoy.replace(/\//g, '-')}.pdf`);
}
