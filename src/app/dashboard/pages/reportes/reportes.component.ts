import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ReporteInventarioCajaMaster,
  ReporteInventarioTransitoPorTonoPiel,
  ReporteProductosB2BPorCategoria,
  ReportesService
} from './reportes.service';

interface ReporteCatalogo {
  id: 'inventario-caja-master' | 'productos-b2b-categoria' | 'inventario-transito-tono-piel';
  titulo: string;
  descripcion: string;
  detalle: string;
  requiereFechas?: boolean;
}

interface PdfDependencias {
  jsPDF: JsPdfConstructor;
  autoTable: AutoTableFn;
  logo: string;
}

type JsPdfConstructor = typeof import('jspdf').jsPDF;
type AutoTableFn = typeof import('jspdf-autotable').autoTable;
type JsPdfInstance = InstanceType<JsPdfConstructor>;

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent {
  reportes: ReporteCatalogo[] = [
    {
      id: 'inventario-caja-master',
      titulo: 'Inventario Caja Master para Subastas',
      descripcion: 'Resumen de productos disponibles para subastas.',
      detalle: 'Cantidad total de unidades y Cajas Master.'
    },
    {
      id: 'productos-b2b-categoria',
      titulo: 'Productos B2B por Categor\u00eda',
      descripcion: 'Cantidad de productos comprados por categor\u00eda.',
      detalle: 'Cantidad de SKUs adquiridos por clientes B2B por categor\u00eda de producto.',
      requiereFechas: true
    },
    {
      id: 'inventario-transito-tono-piel',
      titulo: 'Inventario en Tr\u00e1nsito por Tono de Piel',
      descripcion: 'Distribuci\u00f3n porcentual del inventario en tr\u00e1nsito.',
      detalle: 'Agrupa estrictamente por el atributo Tono de Piel.'
    }
  ];

  fechasProductosB2B = {
    inicio: '',
    fin: ''
  };

  reporteGenerando: ReporteCatalogo['id'] | null = null;
  error = '';
  mensaje = '';

  constructor(private reportesService: ReportesService) {}

  async generarReporte(reporte: ReporteCatalogo) {
    this.reporteGenerando = reporte.id;
    this.error = '';
    this.mensaje = '';

    try {
      if (reporte.id === 'inventario-caja-master') {
        await this.generarReporteInventarioCajaMaster();
      } else if (reporte.id === 'productos-b2b-categoria') {
        await this.generarReporteProductosB2BPorCategoria();
      } else if (reporte.id === 'inventario-transito-tono-piel') {
        await this.generarReporteInventarioTransitoPorTonoPiel();
      }

      this.mensaje = 'Reporte generado correctamente.';
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo generar el reporte.';
    } finally {
      this.reporteGenerando = null;
    }
  }

  estaGenerando(reporte: ReporteCatalogo) {
    return this.reporteGenerando === reporte.id;
  }

  private async generarReporteInventarioCajaMaster() {
    const [datos, dependencias] = await Promise.all([
      this.reportesService.consultarInventarioCajaMaster(),
      this.cargarDependenciasPdf()
    ]);

    this.generarPdfInventarioCajaMaster(datos, dependencias);
  }

  private async generarReporteProductosB2BPorCategoria() {
    this.validarFechasProductosB2B();

    const [datos, dependencias] = await Promise.all([
      this.reportesService.consultarProductosB2BPorCategoria(
        this.fechasProductosB2B.inicio,
        this.fechasProductosB2B.fin
      ),
      this.cargarDependenciasPdf()
    ]);

    this.generarPdfProductosB2BPorCategoria(datos, dependencias);
  }

  private async generarReporteInventarioTransitoPorTonoPiel() {
    const [datos, dependencias] = await Promise.all([
      this.reportesService.consultarInventarioTransitoPorTonoPiel(),
      this.cargarDependenciasPdf()
    ]);

    this.generarPdfInventarioTransitoPorTonoPiel(datos, dependencias);
  }

  private generarPdfInventarioCajaMaster(datos: ReporteInventarioCajaMaster, dependencias: PdfDependencias) {
    const doc = this.crearDocumento(dependencias.jsPDF);
    const usuarioGenerador = this.obtenerUsuarioGenerador();
    const colores = this.obtenerColoresPdf();

    this.agregarEncabezadoReporte(doc, dependencias.logo, 'Inventario para Subastas', usuarioGenerador);

    dependencias.autoTable(doc, {
      startY: 86,
      head: [['SKU', 'Caja Master']],
      body: [[
        this.formatearEntero(datos.sku),
        this.formatearDecimal(datos.caja_master)
      ]],
      theme: 'grid',
      styles: this.obtenerEstilosTabla(colores),
      headStyles: this.obtenerEstilosEncabezadoTabla(colores),
      bodyStyles: {
        halign: 'center' as const
      },
      alternateRowStyles: {
        fillColor: '#fff7fb'
      },
      margin: { left: 18, right: 18 }
    });

    this.agregarPieDePagina(doc, usuarioGenerador);
    doc.save('reporte-inventario-caja-master.pdf');
  }

  private generarPdfProductosB2BPorCategoria(datos: ReporteProductosB2BPorCategoria[], dependencias: PdfDependencias) {
    const doc = this.crearDocumento(dependencias.jsPDF);
    const usuarioGenerador = this.obtenerUsuarioGenerador();
    const colores = this.obtenerColoresPdf();

    this.agregarEncabezadoReporte(doc, dependencias.logo, 'Productos B2B por Categoría', usuarioGenerador);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(colores.texto);
    doc.text(`Fecha inicio: ${this.formatearFecha(this.fechasProductosB2B.inicio)}`, 18, 84);
    doc.text(`Fecha fin: ${this.formatearFecha(this.fechasProductosB2B.fin)}`, 72, 84);

    dependencias.autoTable(doc, {
      startY: 92,
      head: [['Cantidad', 'Categor\u00eda']],
      body: this.obtenerFilasProductosB2B(datos),
      theme: 'grid',
      styles: this.obtenerEstilosTabla(colores),
      headStyles: this.obtenerEstilosEncabezadoTabla(colores),
      bodyStyles: {
        halign: 'center' as const
      },
      columnStyles: {
        1: { halign: 'left' as const }
      },
      alternateRowStyles: {
        fillColor: '#fff7fb'
      },
      margin: { left: 18, right: 18 }
    });

    this.agregarPieDePagina(doc, usuarioGenerador);
    doc.save('reporte-productos-b2b-por-categoria.pdf');
  }

  private generarPdfInventarioTransitoPorTonoPiel(datos: ReporteInventarioTransitoPorTonoPiel[], dependencias: PdfDependencias) {
    const doc = this.crearDocumento(dependencias.jsPDF);
    const usuarioGenerador = this.obtenerUsuarioGenerador();
    const colores = this.obtenerColoresPdf();

    this.agregarEncabezadoReporte(doc, dependencias.logo, 'Inventario en Tránsito por Tono de Piel', usuarioGenerador);

    dependencias.autoTable(doc, {
      startY: 86,
      head: [['Tono de Piel', 'Porcentaje']],
      body: this.obtenerFilasInventarioTransitoPorTonoPiel(datos),
      theme: 'grid',
      styles: this.obtenerEstilosTabla(colores),
      headStyles: this.obtenerEstilosEncabezadoTabla(colores),
      bodyStyles: {
        halign: 'center' as const
      },
      columnStyles: {
        0: { halign: 'left' as const }
      },
      alternateRowStyles: {
        fillColor: '#fff7fb'
      },
      margin: { left: 18, right: 18 }
    });

    this.agregarPieDePagina(doc, usuarioGenerador);
    doc.save('reporte-inventario-transito-tono-piel.pdf');
  }

  private agregarEncabezadoReporte(doc: JsPdfInstance, logoDataUrl: string, nombreReporte: string, usuarioGenerador: string) {
    const colores = this.obtenerColoresPdf();
    const fecha = new Intl.DateTimeFormat('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());

    doc.setTextColor(colores.principal);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(nombreReporte, 18, 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colores.principal);
    doc.text('Mattel UCAB', 18, 31);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colores.texto);
    doc.text('Localidad: Venezuela, Caracas', 18, 38);
    doc.text('Tel\u00e9fono: 04121312245', 18, 45);
    doc.text('Correo: mattelucab@ucab.edu.ve', 18, 52);
    doc.text(`Generado por: ${usuarioGenerador}`, 18, 59);
    doc.text(`Fecha de generaci\u00f3n: ${fecha}`, 18, 66);

    doc.addImage(logoDataUrl, 'PNG', 162, 17, 32, 20, undefined, 'FAST');

    doc.setDrawColor(colores.principal);
    doc.setLineWidth(1.2);
    doc.line(18, 76, 197, 76);
  }
  private agregarPieDePagina(doc: JsPdfInstance, usuarioGenerador: string) {
    const totalPaginas = doc.getNumberOfPages();

    for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
      doc.setPage(pagina);
      doc.setDrawColor('#d41484');
      doc.line(18, 260, 197, 260);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor('#d41484');
      doc.text(`Generado por ${usuarioGenerador}`, 18, 267);
      doc.text(`Pagina ${pagina} de ${totalPaginas}`, 177, 267);
    }
  }

  private async cargarDependenciasPdf(): Promise<PdfDependencias> {
    const [logo, jspdfModule, autoTableModule] = await Promise.all([
      this.cargarImagenComoDataUrl('assets/mattelucab-logo.png'),
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    return {
      jsPDF: jspdfModule.jsPDF,
      autoTable: autoTableModule.autoTable,
      logo
    };
  }

  private crearDocumento(jsPDF: JsPdfConstructor) {
    return new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
      compress: true
    });
  }

  private obtenerColoresPdf() {
    return {
      principal: '#d41484',
      texto: '#111827',
      borde: '#e5e7eb'
    };
  }

  private obtenerEstilosTabla(colores: ReturnType<ReportesComponent['obtenerColoresPdf']>) {
    return {
      font: 'helvetica',
      fontSize: 11,
      cellPadding: 5,
      lineColor: colores.borde,
      lineWidth: 0.2,
      textColor: colores.texto
    };
  }

  private obtenerEstilosEncabezadoTabla(colores: ReturnType<ReportesComponent['obtenerColoresPdf']>) {
    return {
      fillColor: colores.principal,
      textColor: '#ffffff',
      fontStyle: 'bold' as const,
      halign: 'center' as const
    };
  }

  private obtenerFilasProductosB2B(datos: ReporteProductosB2BPorCategoria[]) {
    if (datos.length === 0) {
      return [['0', 'Sin categorias en el rango seleccionado']];
    }

    return datos.map((item) => [
      this.formatearEntero(item.cantidad),
      item.nombre_categoria || 'Sin categoria'
    ]);
  }

  private obtenerFilasInventarioTransitoPorTonoPiel(datos: ReporteInventarioTransitoPorTonoPiel[]) {
    if (datos.length === 0) {
      return [['Sin tonos de piel en transito', '0,00 %']];
    }

    return datos.map((item) => [
      item.nombre_color || 'Sin tono de piel',
      `${this.formatearDecimal(item.porcentaje)} %`
    ]);
  }

  private validarFechasProductosB2B() {
    if (!this.fechasProductosB2B.inicio || !this.fechasProductosB2B.fin) {
      throw new Error('Selecciona fecha inicio y fecha fin para generar este reporte.');
    }

    if (this.fechasProductosB2B.fin < this.fechasProductosB2B.inicio) {
      throw new Error('La fecha fin no puede ser menor que la fecha inicio.');
    }
  }

  private async cargarImagenComoDataUrl(url: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('No se pudo cargar el logo del reporte.');
    }

    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('No se pudo preparar el logo del reporte.'));
      reader.readAsDataURL(blob);
    });
  }

  private obtenerUsuarioGenerador() {
    return localStorage.getItem('userName') || 'Usuario';
  }

  private formatearEntero(valor: number) {
    return new Intl.NumberFormat('es-VE', {
      maximumFractionDigits: 0
    }).format(Number(valor ?? 0));
  }

  private formatearDecimal(valor: number | string) {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(valor ?? 0));
  }

  private formatearFecha(valor: string) {
    if (!valor) {
      return 'Sin fecha';
    }

    const [year, month, day] = valor.split('-');
    return `${day}/${month}/${year}`;
  }
}
