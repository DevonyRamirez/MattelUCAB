import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ReportesService,
  CajasMasterRow,
  SkusB2bRow,
  InventarioTonoRow
} from './reportes.service';
import { LOGO_MATTELUCAB } from './logo-mattelucab';

type ReporteKey = 'cajas' | 'skus' | 'tono';

interface EstadoReporte {
  cargando: boolean;
  error: string | null;
  columnas: string[];
  filas: (string | number)[][];
  generado: boolean;
  expandido: boolean;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent {
  // Rango de fechas para el reporte de SKUs B2B
  fechaInicio = '2026-01-01';
  fechaFin = '2026-12-31';

  estado: Record<ReporteKey, EstadoReporte> = {
    cajas: this.estadoInicial(),
    skus: this.estadoInicial(),
    tono: this.estadoInicial()
  };

  constructor(private reportesService: ReportesService) {}

  private estadoInicial(): EstadoReporte {
    return { cargando: false, error: null, columnas: [], filas: [], generado: false, expandido: false };
  }

  /** "Ver resultado": carga los datos si hace falta y muestra/oculta la tabla (sin descargar PDF). */
  async verResultado(key: ReporteKey): Promise<void> {
    const e = this.estado[key];
    if (e.expandido) {
      e.expandido = false;
      return;
    }
    let ok = false;
    if (key === 'cajas') {
      ok = await this.cargarCajas();
    } else if (key === 'skus') {
      ok = await this.cargarSkus();
    } else {
      ok = await this.cargarTono();
    }
    if (ok) {
      e.expandido = true;
    }
  }

  private async cargarCajas(): Promise<boolean> {
    const e = this.estado.cajas;
    e.cargando = true;
    e.error = null;
    try {
      const filas = await this.reportesService.cajasMasterSubastas();
      e.columnas = ['SKU (unidades)', 'Cajas Máster'];
      e.filas = filas.map((r: CajasMasterRow) => [r.sku, r.cajas_master]);
      e.generado = true;
      return true;
    } catch (err: any) {
      e.error = err?.message ?? 'No se pudo cargar el reporte.';
      return false;
    } finally {
      e.cargando = false;
    }
  }

  async generarCajas(): Promise<void> {
    const ok = await this.cargarCajas();
    if (!ok) {
      return;
    }
    const e = this.estado.cajas;
    this.descargarPdf(
      'reporte-cajas-master.pdf',
      'Unidades y Cajas Máster para Subastas',
      'Total de SKUs en inventario de subastas (estatus 6) y su equivalente en Cajas Máster (12 unidades).',
      e.columnas,
      e.filas
    );
  }

  /** Obtiene los datos del reporte de SKUs y actualiza la tabla (sin descargar PDF). */
  private async cargarSkus(): Promise<boolean> {
    const e = this.estado.skus;
    if (!this.fechaInicio || !this.fechaFin) {
      e.error = 'Selecciona la fecha de inicio y de fin.';
      return false;
    }
    if (this.fechaInicio > this.fechaFin) {
      e.error = 'La fecha de inicio no puede ser posterior a la fecha de fin.';
      return false;
    }
    e.cargando = true;
    e.error = null;
    try {
      const filas = await this.reportesService.skusB2bPorCategoria(this.fechaInicio, this.fechaFin);
      e.columnas = ['Categoría', 'Cantidad de SKUs'];
      e.filas = filas.map((r: SkusB2bRow) => [r.nombre_categoria, r.cantidad_skus]);
      e.generado = true;
      return true;
    } catch (err: any) {
      e.error = err?.message ?? 'No se pudo cargar el reporte.';
      return false;
    } finally {
      e.cargando = false;
    }
  }

  /** Al cambiar el rango de fechas, refresca la tabla en vivo si ya está cargada. */
  onFechaSkusChange(): void {
    if (this.estado.skus.generado) {
      this.cargarSkus();
    }
  }

  async generarSkus(): Promise<void> {
    const ok = await this.cargarSkus();
    if (!ok) {
      return;
    }
    const e = this.estado.skus;
    this.descargarPdf(
      'reporte-skus-b2b.pdf',
      'SKUs adquiridos por clientes B2B por categoría',
      `Cantidad de SKUs comprados por Retail Partners (B2B) entre ${this.fechaInicio} y ${this.fechaFin}, agrupados por categoría.`,
      e.columnas,
      e.filas
    );
  }

  private async cargarTono(): Promise<boolean> {
    const e = this.estado.tono;
    e.cargando = true;
    e.error = null;
    try {
      const filas = await this.reportesService.inventarioTransitoPorTono();
      e.columnas = ['Tono de Piel', '% del inventario en tránsito'];
      e.filas = filas.map((r: InventarioTonoRow) => [r.nombre_color, `${r.porcentaje} %`]);
      e.generado = true;
      return true;
    } catch (err: any) {
      e.error = err?.message ?? 'No se pudo cargar el reporte.';
      return false;
    } finally {
      e.cargando = false;
    }
  }

  async generarTono(): Promise<void> {
    const ok = await this.cargarTono();
    if (!ok) {
      return;
    }
    const e = this.estado.tono;
    this.descargarPdf(
      'reporte-inventario-transito.pdf',
      'Inventario en tránsito por Tono de Piel',
      'Distribución porcentual del inventario en tránsito (estatus 3) agrupado por tono de piel.',
      e.columnas,
      e.filas
    );
  }

  /** Arma el PDF con marca MattelUCAB y una tabla, y lo descarga. */
  private descargarPdf(
    archivo: string,
    titulo: string,
    subtitulo: string,
    columnas: string[],
    filas: (string | number)[][]
  ): void {
    const doc = new jsPDF();
    const rosa: [number, number, number] = [212, 20, 132];

    // Logo MattelUCAB (677x368 => relacion ~1.84). Ancho 46mm.
    doc.addImage(LOGO_MATTELUCAB, 'PNG', 14, 10, 46, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Mercado exclusivo de activos coleccionables', 14, 40);

    doc.setDrawColor(rosa[0], rosa[1], rosa[2]);
    doc.setLineWidth(1);
    doc.line(14, 44, 196, 44);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(rosa[0], rosa[1], rosa[2]);
    doc.text(titulo, 14, 54);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(subtitulo, 14, 60, { maxWidth: 182 });

    autoTable(doc, {
      head: [columnas],
      body: filas.length ? filas : [['Sin datos', ...columnas.slice(1).map(() => '')]],
      startY: 68,
      headStyles: { fillColor: rosa, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [253, 241, 248] },
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 3 },
      margin: { left: 14, right: 14 }
    });

    const fecha = new Date().toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const finalY = (doc as any).lastAutoTable?.finalY ?? 60;
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text(
      `Generado por MattelUCAB · ${fecha} · Datos vía stored procedures (Supabase RPC)`,
      14,
      finalY + 10
    );

    doc.save(archivo);
  }
}
