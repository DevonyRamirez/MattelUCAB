import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import DataTable from 'datatables.net-dt';
import { PrivilegiosService, RolPrivilegios } from '../privilegios/privilegios.service';
import { CrearUsuarioPayload, ModificarRolPayload, PersonaConUsuario, PersonaSinUsuario, UsuariosService } from './usuarios.service';

interface DataTableInstance {
  destroy: () => void;
}

type SegmentoUsuarios = 'sin_usuario' | 'con_usuario';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit, OnDestroy {
  @ViewChild('usuariosTable') usuariosTable?: ElementRef<HTMLTableElement>;

  personasSinUsuario: PersonaSinUsuario[] = [];
  personasConUsuario: PersonaConUsuario[] = [];
  roles: RolPrivilegios[] = [];
  segmentoActivo: SegmentoUsuarios = 'sin_usuario';
  modalCrearAbierto = false;
  modalRolAbierto = false;
  cargando = true;
  guardando = false;
  tablaVisible = true;
  error = '';
  mensaje = '';
  tipoMensaje: 'success' | 'info' | 'error' = 'info';

  nuevoUsuario: CrearUsuarioPayload = this.obtenerFormularioCrearInicial();
  rolUsuario: ModificarRolPayload = this.obtenerFormularioRolInicial();

  private dataTable?: DataTableInstance;

  constructor(
    private usuariosService: UsuariosService,
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
      const [personasSinUsuario, personasConUsuario, roles] = await Promise.all([
        this.usuariosService.consultarPersonasSinUsuario(),
        this.usuariosService.consultarPersonasConUsuario(),
        this.privilegiosService.consultarPrivilegiosPorRol()
      ]);

      this.personasSinUsuario = personasSinUsuario;
      this.personasConUsuario = personasConUsuario;
      this.roles = roles;
    } catch (error) {
      this.personasSinUsuario = [];
      this.personasConUsuario = [];
      this.roles = [];
      this.error = error instanceof Error ? error.message : 'No se pudieron cargar los usuarios.';
    } finally {
      this.cargando = false;
      this.tablaVisible = !this.error;
      await this.refrescarVista();

      if (!this.error) {
        this.inicializarDataTable();
      }
    }
  }

  async cargarUsuarios() {
    await this.recargarTabla();
  }

  async cambiarSegmento(segmento: SegmentoUsuarios) {
    if (this.segmentoActivo === segmento) {
      return;
    }

    this.segmentoActivo = segmento;
    this.mensaje = '';
    this.destruirDataTable();
    this.tablaVisible = false;
    await this.refrescarVista();
    this.tablaVisible = !this.error;
    await this.refrescarVista();

    if (!this.error) {
      this.inicializarDataTable();
    }
  }

  abrirModalCrear(persona?: PersonaSinUsuario) {
    this.modalCrearAbierto = true;
    this.modalRolAbierto = false;
    this.mensaje = '';
    this.nuevoUsuario = {
      ...this.obtenerFormularioCrearInicial(),
      personaId: persona ? this.obtenerPersonaId(persona) : 0,
      tipoPersona: persona ? this.obtenerTipo(persona) : ''
    };
  }

  abrirModalRol(persona?: PersonaConUsuario) {
    this.modalRolAbierto = true;
    this.modalCrearAbierto = false;
    this.mensaje = '';
    this.rolUsuario = persona
      ? {
          usuarioId: this.obtenerUsuarioId(persona),
          nombreUsuarioActual: persona.nombre_usuario ?? '',
          nombreUsuario: persona.nombre_usuario ?? '',
          contrasenaUsuario: '',
          rolId: this.obtenerRolId(persona)
        }
      : this.obtenerFormularioRolInicial();
  }

  cancelarCrearUsuario() {
    this.modalCrearAbierto = false;
    this.nuevoUsuario = this.obtenerFormularioCrearInicial();
  }

  cancelarModificarRol() {
    this.modalRolAbierto = false;
    this.rolUsuario = this.obtenerFormularioRolInicial();
  }

  async crearUsuario() {
    if (!this.nuevoUsuario.personaId || !this.nuevoUsuario.nombreUsuario.trim() || !this.nuevoUsuario.contrasenaUsuario || !this.nuevoUsuario.rolId) {
      this.mostrarMensaje('Completa persona, usuario, contrasena y rol antes de guardar.', 'error');
      return;
    }

    this.guardando = true;

    try {
      const resultado = await this.usuariosService.crearUsuario({
        ...this.nuevoUsuario,
        nombreUsuario: this.nuevoUsuario.nombreUsuario.trim(),
        tipoPersona: this.nuevoUsuario.tipoPersona || this.obtenerTipoPersonaSeleccionada()
      });
      this.modalCrearAbierto = false;
      await this.recargarTabla();
      this.mostrarMensaje(resultado.mensaje, resultado.ok ? 'success' : 'error');
    } catch (error) {
      this.mostrarMensaje(error instanceof Error ? error.message : 'No se pudo crear el usuario.', 'error');
    } finally {
      this.guardando = false;
    }
  }

  async modificarRolUsuario() {
    if (!this.rolUsuario.nombreUsuario.trim() || !this.rolUsuario.rolId) {
      this.mostrarMensaje('Completa el usuario y el rol antes de guardar.', 'error');
      return;
    }

    this.guardando = true;

    try {
      const resultado = await this.usuariosService.modificarRolUsuario({
        ...this.rolUsuario,
        nombreUsuario: this.rolUsuario.nombreUsuario.trim(),
        contrasenaUsuario: this.rolUsuario.contrasenaUsuario.trim()
      });
      this.modalRolAbierto = false;
      await this.recargarTabla();
      this.mostrarMensaje(resultado.mensaje, resultado.ok ? 'success' : 'error');
    } catch (error) {
      this.mostrarMensaje(error instanceof Error ? error.message : 'No se pudo modificar el usuario.', 'error');
    } finally {
      this.guardando = false;
    }
  }

  obtenerPersonaId(persona: PersonaSinUsuario) {
    return Number(persona.id_persona ?? 0);
  }

  obtenerIdentificacion(persona: PersonaSinUsuario) {
    return persona.rif || 'Sin RIF';
  }

  obtenerNombre(persona: PersonaSinUsuario) {
    return persona.nombre_o_razon_social || 'Sin nombre';
  }

  obtenerTipo(persona: PersonaSinUsuario) {
    return persona.tipo_persona || 'Sin tipo';
  }

  obtenerApellidoOComercial(persona: PersonaSinUsuario) {
    return persona.apellido_o_comercial || 'Sin dato';
  }

  obtenerTipoPersonaSeleccionada() {
    const persona = this.personasSinUsuario.find((item) => this.obtenerPersonaId(item) === Number(this.nuevoUsuario.personaId));
    return persona ? this.obtenerTipo(persona) : '';
  }

  obtenerUsuarioId(persona: PersonaConUsuario) {
    return persona.id_usuario ? Number(persona.id_usuario) : null;
  }

  obtenerRolId(persona: PersonaConUsuario) {
    if (persona.id_rol) {
      return Number(persona.id_rol);
    }

    const rol = this.roles.find((item) => item.nombre_rol === persona.nombre_rol);
    return rol?.id_rol ?? 0;
  }

  private async recargarTabla() {
    this.destruirDataTable();
    this.tablaVisible = false;
    this.error = '';
    await this.refrescarVista();

    try {
      if (this.segmentoActivo === 'sin_usuario') {
        this.personasSinUsuario = await this.usuariosService.consultarPersonasSinUsuario();
      } else {
        this.personasConUsuario = await this.usuariosService.consultarPersonasConUsuario();
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudieron cargar los usuarios.';
    } finally {
      this.tablaVisible = !this.error;
      await this.refrescarVista();

      if (!this.error) {
        this.inicializarDataTable();
      }
    }
  }

  private obtenerFormularioCrearInicial(): CrearUsuarioPayload {
    return {
      personaId: 0,
      tipoPersona: '',
      nombreUsuario: '',
      contrasenaUsuario: '',
      rolId: 0
    };
  }

  private obtenerFormularioRolInicial(): ModificarRolPayload {
    return {
      usuarioId: null,
      nombreUsuarioActual: '',
      nombreUsuario: '',
      contrasenaUsuario: '',
      rolId: 0
    };
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'info' | 'error') {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
  }

  private inicializarDataTable() {
    if (!this.usuariosTable) {
      return;
    }

    this.dataTable = new DataTable(this.usuariosTable.nativeElement, {
      order: [[2, 'asc']],
      pageLength: 5,
      lengthMenu: [5, 10, 20],
      language: {
        search: 'Buscar:',
        lengthMenu: 'Mostrar _MENU_ filas',
        info: 'Mostrando _START_ a _END_ de _TOTAL_ personas',
        infoEmpty: 'Mostrando 0 a 0 de 0 personas',
        infoFiltered: '(filtrado de _MAX_ personas)',
        zeroRecords: 'No se encontraron personas con esos filtros.',
        emptyTable: this.segmentoActivo === 'sin_usuario'
          ? 'No hay personas sin usuario para mostrar.'
          : 'No hay personas con usuario para mostrar.',
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
