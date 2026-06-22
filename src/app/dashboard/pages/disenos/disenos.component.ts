import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import DataTable from 'datatables.net-dt';
import {
  BaseDisenoPayload,
  CaracteristicaItem,
  CaracteristicasPayload,
  ConstruccionItem,
  DisenoDetalle,
  DisenoResumen,
  DisenosCatalogos,
  DisenosService,
  FaseDisenoItem
} from './disenos.service';

interface DataTableInstance {
  destroy: () => void;
}

type PasoDiseno = 1 | 2 | 3 | 4;
type TipoMensaje = 'success' | 'info' | 'error';

@Component({
  selector: 'app-disenos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './disenos.component.html',
  styleUrl: './disenos.component.css'
})
export class DisenosComponent implements OnInit, OnDestroy {
  @ViewChild('disenosTable') disenosTable?: ElementRef<HTMLTableElement>;

  catalogos: DisenosCatalogos = this.obtenerCatalogosVacios();
  disenos: DisenoResumen[] = [];
  pasoActivo: PasoDiseno = 1;
  idBasediseno: number | null = null;
  cargando = true;
  guardando = false;
  tablaVisible = true;
  modalDisenoAbierto = false;
  error = '';
  mensaje = '';
  tipoMensaje: TipoMensaje = 'info';
  detalleConsultado: DisenoResumen | null = null;

  baseDiseno: BaseDisenoPayload = this.obtenerBaseDisenoInicial();
  construccionItems: ConstruccionItem[] = [this.obtenerConstruccionInicial()];
  caracteristicas: CaracteristicasPayload = this.obtenerCaracteristicasIniciales();
  fasesItems: FaseDisenoItem[] = [this.obtenerFaseInicial()];

  private dataTable?: DataTableInstance;

  constructor(
    private disenosService: DisenosService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarDatosIniciales();
  }

  ngOnDestroy() {
    this.destruirDataTable();
  }

  async cargarDatosIniciales() {
    this.destruirDataTable();
    this.tablaVisible = false;
    this.cargando = true;
    this.error = '';

    try {
      const [catalogos, disenos] = await Promise.all([
        this.disenosService.consultarCatalogos(),
        this.disenosService.consultarDisenos()
      ]);

      this.catalogos = catalogos;
      this.disenos = disenos;
    } catch (error) {
      this.catalogos = this.obtenerCatalogosVacios();
      this.disenos = [];
      this.error = error instanceof Error ? error.message : 'No se pudieron cargar los datos de disenos.';
    } finally {
      this.cargando = false;
      this.tablaVisible = !this.error;
      await this.refrescarVista();

      if (!this.error) {
        this.inicializarDataTable();
      }
    }
  }

  async recargarDisenos() {
    this.destruirDataTable();
    this.tablaVisible = false;
    this.error = '';
    await this.refrescarVista();

    try {
      this.disenos = await this.disenosService.consultarDisenos();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudieron recargar las munecas.';
    } finally {
      this.tablaVisible = !this.error;
      await this.refrescarVista();

      if (!this.error) {
        this.inicializarDataTable();
      }
    }
  }

  abrirModalNuevoDiseno() {
    this.nuevoDiseno();
    this.modalDisenoAbierto = true;
  }

  cerrarModalDiseno() {
    if (this.guardando) {
      return;
    }

    this.modalDisenoAbierto = false;
  }

  nuevoDiseno() {
    this.idBasediseno = null;
    this.detalleConsultado = null;
    this.pasoActivo = 1;
    this.baseDiseno = this.obtenerBaseDisenoInicial();
    this.construccionItems = [this.obtenerConstruccionInicial()];
    this.caracteristicas = this.obtenerCaracteristicasIniciales();
    this.fasesItems = [this.obtenerFaseInicial()];
    this.mostrarMensaje('Formulario listo para crear un nuevo diseno.', 'info');
  }

  cambiarPaso(paso: PasoDiseno) {
    if (paso > 1 && !this.idBasediseno) {
      this.mostrarMensaje('Guarda la fase 1 para continuar con las demas fases.', 'error');
      return;
    }

    this.pasoActivo = paso;
    this.mensaje = '';
  }

  async guardarFase1() {
    if (!this.baseDiseno.eraId || !this.baseDiseno.coleccionId || !this.baseDiseno.nombre.trim() || !this.baseDiseno.descripcion.trim()) {
      this.mostrarMensaje('Completa era, coleccion, nombre y descripcion.', 'error');
      return;
    }

    if (!this.baseDiseno.alto || !this.baseDiseno.ancho || !this.baseDiseno.profundidad) {
      this.mostrarMensaje('Completa las medidas del diseno.', 'error');
      return;
    }

    this.guardando = true;

    try {
      const resultado = await this.disenosService.guardarBaseDiseno({
        ...this.baseDiseno,
        idBasediseno: this.idBasediseno,
        nombre: this.baseDiseno.nombre.trim(),
        descripcion: this.baseDiseno.descripcion.trim()
      });

      if (resultado.ok && resultado.id_basediseno) {
        this.idBasediseno = Number(resultado.id_basediseno);
        this.baseDiseno.idBasediseno = this.idBasediseno;
        this.pasoActivo = 2;
        await this.recargarDisenos();
      }

      this.mostrarMensaje(resultado.mensaje, resultado.ok ? 'success' : 'error');
    } catch (error) {
      this.mostrarMensaje(error instanceof Error ? error.message : 'No se pudo guardar la fase 1.', 'error');
    } finally {
      this.guardando = false;
    }
  }

  async guardarFase2() {
    if (!this.idBasediseno) {
      this.mostrarMensaje('Primero guarda la fase 1.', 'error');
      return;
    }

    const items = this.construccionItems.map((item) => ({
      piezaId: Number(item.piezaId),
      moldeId: Number(item.moldeId),
      materiaPrimaId: Number(item.materiaPrimaId),
      cantidadMateriaPrima: Number(item.cantidadMateriaPrima)
    }));

    if (items.some((item) => !item.piezaId || !item.moldeId || !item.materiaPrimaId || item.cantidadMateriaPrima <= 0)) {
      this.mostrarMensaje('Completa pieza, molde, materia prima y cantidad en cada fila.', 'error');
      return;
    }

    this.guardando = true;

    try {
      const resultado = await this.disenosService.guardarConstruccion(this.idBasediseno, items);

      if (resultado.ok) {
        this.pasoActivo = 3;
      }

      this.mostrarMensaje(resultado.mensaje, resultado.ok ? 'success' : 'error');
    } catch (error) {
      this.mostrarMensaje(error instanceof Error ? error.message : 'No se pudo guardar la fase 2.', 'error');
    } finally {
      this.guardando = false;
    }
  }

  async guardarFase3() {
    if (!this.idBasediseno) {
      this.mostrarMensaje('Primero guarda la fase 1.', 'error');
      return;
    }

    const payload: CaracteristicasPayload = {
      profesionIds: this.caracteristicas.profesionIds,
      clasificacionIds: this.caracteristicas.clasificacionIds,
      categoriaIds: this.caracteristicas.categoriaIds,
      setRegaloIds: this.caracteristicas.setRegaloIds,
      caracteristicas: this.caracteristicas.caracteristicas
        .map((item) => ({ caracteristicaId: Number(item.caracteristicaId), valor: item.valor.trim() }))
        .filter((item) => item.caracteristicaId > 0 && item.valor)
    };

    this.guardando = true;

    try {
      const resultado = await this.disenosService.guardarCaracteristicas(this.idBasediseno, payload);

      if (resultado.ok) {
        this.pasoActivo = 4;
      }

      this.mostrarMensaje(resultado.mensaje, resultado.ok ? 'success' : 'error');
    } catch (error) {
      this.mostrarMensaje(error instanceof Error ? error.message : 'No se pudo guardar la fase 3.', 'error');
    } finally {
      this.guardando = false;
    }
  }

  async guardarFase4() {
    if (!this.idBasediseno) {
      this.mostrarMensaje('Primero guarda la fase 1.', 'error');
      return;
    }

    const items = this.fasesItems.map((item) => ({
      pruebaId: Number(item.pruebaId),
      faseId: Number(item.faseId),
      cargoId: Number(item.cargoId),
      cantidadCargo: Number(item.cantidadCargo)
    }));

    if (items.some((item) => !item.pruebaId || !item.faseId || !item.cargoId || item.cantidadCargo <= 0)) {
      this.mostrarMensaje('Completa prueba, fase, cargo y cantidad en cada fila.', 'error');
      return;
    }

    this.guardando = true;

    try {
      const resultado = await this.disenosService.guardarFases(this.idBasediseno, items);
      await this.recargarDisenos();
      this.mostrarMensaje(resultado.mensaje, resultado.ok ? 'success' : 'error');
    } catch (error) {
      this.mostrarMensaje(error instanceof Error ? error.message : 'No se pudo guardar la fase 4.', 'error');
    } finally {
      this.guardando = false;
    }
  }

  async consultarDiseno(diseno: DisenoResumen) {
    this.guardando = true;
    this.mensaje = '';

    try {
      const detalle = await this.disenosService.consultarDetalleDiseno(diseno.id_basediseno);
      this.cargarDetalleEnFormulario(detalle);
      this.detalleConsultado = diseno;
      this.pasoActivo = 1;
      this.modalDisenoAbierto = true;
      this.mostrarMensaje('Diseno cargado para consulta y edicion.', 'success');
    } catch (error) {
      this.mostrarMensaje(error instanceof Error ? error.message : 'No se pudo consultar el diseno.', 'error');
    } finally {
      this.guardando = false;
    }
  }

  agregarConstruccion() {
    this.construccionItems = [...this.construccionItems, this.obtenerConstruccionInicial()];
  }

  eliminarConstruccion(index: number) {
    if (this.construccionItems.length === 1) {
      this.construccionItems = [this.obtenerConstruccionInicial()];
      return;
    }

    this.construccionItems = this.construccionItems.filter((_, itemIndex) => itemIndex !== index);
  }

  agregarCaracteristica() {
    this.caracteristicas = {
      ...this.caracteristicas,
      caracteristicas: [...this.caracteristicas.caracteristicas, this.obtenerCaracteristicaInicial()]
    };
  }

  eliminarCaracteristica(index: number) {
    const caracteristicas = this.caracteristicas.caracteristicas.length === 1
      ? [this.obtenerCaracteristicaInicial()]
      : this.caracteristicas.caracteristicas.filter((_, itemIndex) => itemIndex !== index);

    this.caracteristicas = { ...this.caracteristicas, caracteristicas };
  }

  agregarFase() {
    this.fasesItems = [...this.fasesItems, this.obtenerFaseInicial()];
  }

  eliminarFase(index: number) {
    if (this.fasesItems.length === 1) {
      this.fasesItems = [this.obtenerFaseInicial()];
      return;
    }

    this.fasesItems = this.fasesItems.filter((_, itemIndex) => itemIndex !== index);
  }

  cambiarSeleccion(lista: number[], id: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const seleccion = new Set(lista);

    if (checked) {
      seleccion.add(id);
    } else {
      seleccion.delete(id);
    }

    lista.splice(0, lista.length, ...seleccion);
  }

  estaSeleccionado(lista: number[], id: number) {
    return lista.includes(id);
  }

  obtenerDisenosRelacionables() {
    return this.disenos.filter((diseno) => diseno.id_basediseno !== this.idBasediseno);
  }

  formatearMedidas(diseno: DisenoResumen) {
    return `${diseno.alto_basediseno} x ${diseno.ancho_basediseno} x ${diseno.profundidad_basediseno}`;
  }

  private cargarDetalleEnFormulario(detalle: DisenoDetalle) {
    this.idBasediseno = detalle.idBasediseno;
    this.baseDiseno = {
      idBasediseno: detalle.idBasediseno,
      eraId: detalle.eraId,
      baseDisenoId: detalle.baseDisenoId,
      tipoCuerpoId: detalle.tipoCuerpoId,
      coleccionId: detalle.coleccionId,
      colorOjosId: detalle.colorOjosId,
      colorTonoPielId: detalle.colorTonoPielId,
      nombre: detalle.nombre,
      descripcion: detalle.descripcion,
      alto: detalle.alto,
      ancho: detalle.ancho,
      profundidad: detalle.profundidad
    };
    this.construccionItems = detalle.construccion.length ? detalle.construccion : [this.obtenerConstruccionInicial()];
    this.caracteristicas = {
      profesionIds: detalle.profesionIds,
      clasificacionIds: detalle.clasificacionIds,
      categoriaIds: detalle.categoriaIds,
      setRegaloIds: detalle.setRegaloIds,
      caracteristicas: detalle.caracteristicas.length ? detalle.caracteristicas : [this.obtenerCaracteristicaInicial()]
    };
    this.fasesItems = detalle.fases.length ? detalle.fases : [this.obtenerFaseInicial()];
  }

  private obtenerBaseDisenoInicial(): BaseDisenoPayload {
    return {
      idBasediseno: null,
      eraId: 0,
      baseDisenoId: null,
      tipoCuerpoId: null,
      coleccionId: 0,
      colorOjosId: null,
      colorTonoPielId: null,
      nombre: '',
      descripcion: '',
      alto: null,
      ancho: null,
      profundidad: null
    };
  }

  private obtenerConstruccionInicial(): ConstruccionItem {
    return {
      piezaId: 0,
      moldeId: 0,
      materiaPrimaId: 0,
      cantidadMateriaPrima: 1
    };
  }

  private obtenerCaracteristicasIniciales(): CaracteristicasPayload {
    return {
      profesionIds: [],
      clasificacionIds: [],
      categoriaIds: [],
      setRegaloIds: [],
      caracteristicas: [this.obtenerCaracteristicaInicial()]
    };
  }

  private obtenerCaracteristicaInicial(): CaracteristicaItem {
    return {
      caracteristicaId: 0,
      valor: ''
    };
  }

  private obtenerFaseInicial(): FaseDisenoItem {
    return {
      pruebaId: 0,
      faseId: 0,
      cargoId: 0,
      cantidadCargo: 1
    };
  }

  private obtenerCatalogosVacios(): DisenosCatalogos {
    return {
      eras: [],
      colecciones: [],
      colores: [],
      tiposCuerpo: [],
      materiasPrimas: [],
      moldes: [],
      piezas: [],
      profesiones: [],
      clasificaciones: [],
      categorias: [],
      setsRegalo: [],
      caracteristicas: [],
      pruebas: [],
      fases: [],
      cargos: []
    };
  }

  private mostrarMensaje(mensaje: string, tipo: TipoMensaje) {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
  }

  private inicializarDataTable() {
    if (!this.disenosTable) {
      return;
    }

    this.dataTable = new DataTable(this.disenosTable.nativeElement, {
      order: [[0, 'desc']],
      pageLength: 5,
      lengthMenu: [5, 10, 20],
      language: {
        search: 'Buscar:',
        lengthMenu: 'Mostrar _MENU_ filas',
        info: 'Mostrando _START_ a _END_ de _TOTAL_ munecas',
        infoEmpty: 'Mostrando 0 a 0 de 0 munecas',
        infoFiltered: '(filtrado de _MAX_ munecas)',
        zeroRecords: 'No se encontraron munecas con esos filtros.',
        emptyTable: 'No hay munecas para mostrar.',
        paginate: {
          first: 'Primero',
          previous: 'Anterior',
          next: 'Siguiente',
          last: 'Ultimo'
        }
      }
    });
  }

  private async refrescarVista() {
    this.changeDetectorRef.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
  }

  private destruirDataTable() {
    if (this.dataTable) {
      this.dataTable.destroy();
      this.dataTable = undefined;
    }
  }
}
