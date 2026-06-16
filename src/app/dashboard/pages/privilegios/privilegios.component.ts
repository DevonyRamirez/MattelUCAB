import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import DataTable from 'datatables.net-dt';
import { Privilegio, PrivilegiosService, RolPrivilegios } from './privilegios.service';

interface DataTableInstance {
  destroy: () => void;
}

@Component({
  selector: 'app-privilegios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './privilegios.component.html',
  styleUrl: './privilegios.component.css'
})
export class PrivilegiosComponent implements OnInit, OnDestroy {
  @ViewChild('privilegiosTable') privilegiosTable?: ElementRef<HTMLTableElement>;

  roles: RolPrivilegios[] = [];
  catalogoPrivilegios: Privilegio[] = [];
  modalAbierto = false;
  modalCrearRolAbierto = false;
  rolSeleccionado = '';
  nombreRol = '';
  descripcionRol = '';
  busquedaPrivilegio = '';
  filtroTipoPrivilegio = '';
  privilegiosExistentes = new Set<number>();
  privilegiosSeleccionados = new Set<number>();
  cargando = true;
  cargandoRol = false;
  guardando = false;
  guardandoRol = false;
  tablaVisible = true;
  error = '';
  mensajeAsignacion = '';
  tipoMensajeAsignacion: 'success' | 'info' | 'error' = 'info';
  private dataTable?: DataTableInstance;

  constructor(
    private privilegiosService: PrivilegiosService,
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
      const [roles, catalogo] = await Promise.all([
        this.privilegiosService.consultarPrivilegiosPorRol(),
        this.privilegiosService.consultarCatalogoPrivilegios()
      ]);

      this.roles = roles;
      this.catalogoPrivilegios = catalogo;
    } catch (error) {
      this.roles = [];
      this.catalogoPrivilegios = [];
      this.error = error instanceof Error ? error.message : 'No se pudieron cargar los privilegios.';
    } finally {
      this.cargando = false;
      this.tablaVisible = !this.error;
      await this.refrescarVista();

      if (!this.error) {
        this.inicializarDataTable();
      }
    }
  }

  async cargarPrivilegios() {
    await this.recargarTabla();
  }

  abrirModalModificar() {
    this.modalAbierto = true;
    this.mensajeAsignacion = '';
  }

  abrirModalCrearRol() {
    this.modalCrearRolAbierto = true;
    this.nombreRol = '';
    this.descripcionRol = '';
    this.mensajeAsignacion = '';
  }

  cancelarCreacionRol() {
    this.modalCrearRolAbierto = false;
    this.nombreRol = '';
    this.descripcionRol = '';
    this.mensajeAsignacion = '';
  }

  cancelarModificacion() {
    this.modalAbierto = false;
    this.rolSeleccionado = '';
    this.busquedaPrivilegio = '';
    this.filtroTipoPrivilegio = '';
    this.privilegiosExistentes = new Set<number>();
    this.privilegiosSeleccionados = new Set<number>();
    this.mensajeAsignacion = '';
  }

  async crearRol() {
    const nombreRol = this.nombreRol.trim();
    const descripcionRol = this.descripcionRol.trim();

    if (!nombreRol) {
      this.mostrarMensaje('Ingresa el nombre del rol.', 'error');
      return;
    }

    if (nombreRol.length > 50) {
      this.mostrarMensaje('El nombre del rol no puede superar 50 caracteres.', 'error');
      return;
    }

    if (descripcionRol.length > 300) {
      this.mostrarMensaje('La descripcion del rol no puede superar 300 caracteres.', 'error');
      return;
    }

    this.guardandoRol = true;

    try {
      const resultado = await this.privilegiosService.crearRol(nombreRol, descripcionRol || null);
      this.modalCrearRolAbierto = false;
      this.nombreRol = '';
      this.descripcionRol = '';
      await this.recargarTabla();
      this.mostrarMensaje(resultado.mensaje, resultado.ok ? 'success' : 'error');
    } catch (error) {
      this.mostrarMensaje(error instanceof Error ? error.message : 'No se pudo crear el rol.', 'error');
    } finally {
      this.guardandoRol = false;
    }
  }

  async seleccionarRol() {
    this.mensajeAsignacion = '';
    this.privilegiosExistentes = new Set<number>();
    this.privilegiosSeleccionados = new Set<number>();

    const roleId = Number(this.rolSeleccionado);
    if (!roleId) {
      return;
    }

    this.cargandoRol = true;

    try {
      const ids = await this.privilegiosService.consultarPrivilegiosIdsPorRol(roleId);
      this.privilegiosExistentes = new Set(ids);
      this.privilegiosSeleccionados = new Set(ids);
    } catch (error) {
      this.mostrarMensaje(error instanceof Error ? error.message : 'No se pudieron cargar los privilegios del rol.', 'error');
    } finally {
      this.cargandoRol = false;
    }
  }

  cambiarPrivilegio(privilegioId: number, checked: boolean) {
    const seleccion = new Set(this.privilegiosSeleccionados);

    if (checked) {
      seleccion.add(privilegioId);
    } else {
      seleccion.delete(privilegioId);
    }

    this.privilegiosSeleccionados = seleccion;
  }

  cambiarPrivilegioDesdeEvento(privilegioId: number, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.cambiarPrivilegio(privilegioId, checkbox.checked);
  }

  marcarPrivilegiosFiltrados() {
    const seleccion = new Set(this.privilegiosSeleccionados);

    for (const privilegio of this.privilegiosFiltrados) {
      seleccion.add(privilegio.id_privilegio);
    }

    this.privilegiosSeleccionados = seleccion;
  }

  desmarcarPrivilegiosFiltrados() {
    const seleccion = new Set(this.privilegiosSeleccionados);

    for (const privilegio of this.privilegiosFiltrados) {
      seleccion.delete(privilegio.id_privilegio);
    }

    this.privilegiosSeleccionados = seleccion;
  }

  estaSeleccionado(privilegioId: number) {
    return this.privilegiosSeleccionados.has(privilegioId);
  }

  yaAsignado(privilegioId: number) {
    return this.privilegiosExistentes.has(privilegioId);
  }

  async asignarPrivilegios() {
    const roleId = Number(this.rolSeleccionado);

    if (!roleId) {
      this.mostrarMensaje('Selecciona un rol antes de aceptar.', 'error');
      return;
    }

    const privilegiosPorAgregar = [...this.privilegiosSeleccionados].filter(
      (id) => !this.privilegiosExistentes.has(id)
    );
    const privilegiosPorEliminar = [...this.privilegiosExistentes].filter(
      (id) => !this.privilegiosSeleccionados.has(id)
    );

    if (privilegiosPorAgregar.length === 0 && privilegiosPorEliminar.length === 0) {
      this.mostrarMensaje('No hay cambios para guardar.', 'info');
      return;
    }

    this.guardando = true;

    try {
      const resultado = await this.privilegiosService.modificarPrivilegiosDeRol(
        roleId,
        privilegiosPorAgregar,
        privilegiosPorEliminar
      );
      this.modalAbierto = false;
      await this.recargarTabla();
      const ids = await this.privilegiosService.consultarPrivilegiosIdsPorRol(roleId);
      this.privilegiosExistentes = new Set(ids);
      this.privilegiosSeleccionados = new Set(ids);
      this.mostrarMensaje(resultado.mensaje, resultado.ok ? 'success' : 'error');
    } catch (error) {
      this.mostrarMensaje(error instanceof Error ? error.message : 'No se pudieron asignar los privilegios.', 'error');
    } finally {
      this.guardando = false;
    }
  }

  get privilegiosAgrupados() {
    const grupos = new Map<string, Privilegio[]>();

    for (const privilegio of this.privilegiosFiltrados) {
      const tipo = privilegio.tipo_privilegio;
      grupos.set(tipo, [...(grupos.get(tipo) ?? []), privilegio]);
    }

    return [...grupos.entries()].map(([tipo, privilegios]) => ({ tipo, privilegios }));
  }

  get tiposPrivilegio() {
    return [...new Set(this.catalogoPrivilegios.map((privilegio) => privilegio.tipo_privilegio))];
  }

  get privilegiosFiltrados() {
    const busqueda = this.busquedaPrivilegio.trim().toLowerCase();

    return this.catalogoPrivilegios.filter((privilegio) => {
      const coincideTipo = !this.filtroTipoPrivilegio || privilegio.tipo_privilegio === this.filtroTipoPrivilegio;
      const coincideBusqueda =
        !busqueda ||
        privilegio.descripcion_privilegio.toLowerCase().includes(busqueda) ||
        privilegio.tipo_privilegio.toLowerCase().includes(busqueda);

      return coincideTipo && coincideBusqueda;
    });
  }

  get cantidadSeleccionada() {
    return this.privilegiosSeleccionados.size;
  }

  get cantidadNuevosSeleccionados() {
    return [...this.privilegiosSeleccionados].filter((id) => !this.privilegiosExistentes.has(id)).length;
  }

  get cantidadPorEliminar() {
    return [...this.privilegiosExistentes].filter((id) => !this.privilegiosSeleccionados.has(id)).length;
  }

  formatearPrivilegios(privilegios: string[] | string | null) {
    if (Array.isArray(privilegios)) {
      return privilegios.length > 0 ? privilegios.join(', ') : 'Sin privilegios';
    }

    if (typeof privilegios === 'string' && privilegios.trim()) {
      return privilegios;
    }

    return 'Sin privilegios';
  }

  private async recargarTabla() {
    this.destruirDataTable();
    this.tablaVisible = false;
    this.error = '';
    await this.refrescarVista();

    try {
      this.roles = await this.privilegiosService.consultarPrivilegiosPorRol();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudieron cargar los privilegios.';
    } finally {
      this.tablaVisible = !this.error;
      await this.refrescarVista();

      if (!this.error) {
        this.inicializarDataTable();
      }
    }
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'info' | 'error') {
    this.mensajeAsignacion = mensaje;
    this.tipoMensajeAsignacion = tipo;
  }

  private inicializarDataTable() {
    if (!this.privilegiosTable) {
      return;
    }

    this.dataTable = new DataTable(this.privilegiosTable.nativeElement, {
      order: [[0, 'asc']],
      pageLength: 5,
      lengthMenu: [5, 10, 20],
      language: {
        search: 'Buscar:',
        lengthMenu: 'Mostrar _MENU_ filas',
        info: 'Mostrando _START_ a _END_ de _TOTAL_ roles',
        infoEmpty: 'Mostrando 0 a 0 de 0 roles',
        infoFiltered: '(filtrado de _MAX_ roles)',
        zeroRecords: 'No se encontraron roles con esos filtros.',
        emptyTable: 'No hay roles para mostrar.',
        paginate: {
          first: 'Primero',
          previous: 'Anterior',
          next: 'Siguiente',
        last: 'Último'
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
