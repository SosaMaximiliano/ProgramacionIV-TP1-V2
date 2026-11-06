# Cinéfila — sistema de gestión de cine

Aplicación web desarrollada como trabajo práctico de Programación IV. Permite consultar películas y funciones, seleccionar butacas, comprar entradas y productos del Candy Bar, y consultar las compras de una cuenta registrada.

> **Estado del proyecto:** el alcance implementado actualmente se centra en el flujo de compra para clientes. El panel administrativo, la validación operativa de QR, PWA y publicación en Firebase están pendientes.

## Tecnologías

- Angular 22 con componentes standalone y rutas lazy-loaded.
- TypeScript, signals y formularios reactivos.
- Supabase para autenticación y acceso a PostgreSQL.
- `qrcode` para generar una imagen QR informativa al confirmar una compra.
- CSS propio para la interfaz responsive.

## Funcionalidades implementadas

- Cartelera con búsqueda y filtro por género.
- Detalle de película y consulta de funciones disponibles.
- Mapa de butacas con estados visuales, sectores accesibles y VIP, y consulta de ocupación.
- Compra de entradas como usuario registrado o invitado.
- Validación de edad según la clasificación de la película; si corresponde, se indica que se debe asistir con una persona adulta.
- Carrito y selección de productos del Candy Bar.
- Selección de un método de pago simulado y registro de la compra en Supabase.
- Descuento del 20 % para la primera compra de una cuenta registrada.
- Generación de QR con los datos de referencia de la compra.
- Sección «Mis compras» protegida para consultar las ventas de una cuenta registrada, con entradas y productos.

El QR actual se genera en el navegador y contiene información de la compra. **No valida el ingreso ni la entrega de productos y no debe tratarse como una credencial segura de uso único.** El pago también es de prueba: la aplicación no procesa cobros reales.

## Arquitectura del proyecto

```text
src/
├── app/
│   ├── components/   # Pantallas y componentes visuales
│   ├── guards/       # Protección de rutas
│   ├── models/       # Interfaces y tipos del dominio
│   └── services/     # Supabase, consultas y lógica compartida
├── environments/     # Configuración de entorno
└── styles.css        # Tokens y estilos globales
```

La aplicación usa componentes standalone. Las rutas principales cargan componentes de forma diferida con `loadComponent` y `loadChildren`. Los servicios encapsulan las consultas a Supabase y las operaciones compartidas, como el carrito. La interfaz usa signals para estado reactivo local y `async`/`await` para las operaciones asíncronas de Supabase.

### Decisiones técnicas relevantes

- **Supabase como backend:** gestiona autenticación y persistencia de datos; Angular consume sus servicios desde los servicios de la aplicación.
- **Compra atómica:** el registro de venta, entradas y detalles de productos se delega a la función PostgreSQL `confirmar_compra`, invocada mediante RPC. La función y sus políticas deben estar creadas y configuradas en el proyecto Supabase.
- **Butacas ocupadas:** la consulta se realiza mediante la función `obtener_butacas_ocupadas`. La disponibilidad definitiva debe protegerse también en la base de datos para evitar ventas simultáneas del mismo asiento.
- **Compra invitada:** Supabase Auth debe permitir el inicio de sesión anónimo. Una compra anónima no forma parte del historial personal de una cuenta registrada. Actualmente el guard comprueba que exista una sesión, mientras que el servicio de compras excluye explícitamente a usuarios anónimos; conviene ajustar el guard para que también exija una cuenta registrada.
- **Persistencia de sesión:** el cliente Supabase se configura actualmente con `persistSession: false`; la sesión no se conserva al recargar la aplicación.
- **QR:** es una representación informativa del pedido generada en el cliente. Para usarlo en operación real haría falta validar un identificador seguro en el backend y registrar cada uso.
- **Pago:** los métodos disponibles son simulados y no cobran dinero.

## Requisitos previos

- Node.js y npm compatibles con Angular CLI 22.
- Un proyecto Supabase configurado con las tablas, relaciones, permisos RLS y funciones RPC que consume la aplicación.
- Credenciales públicas de Supabase para la aplicación.

La estructura SQL completa de Supabase no está incluida en este repositorio. Antes de ejecutar la aplicación, hay que preparar el esquema y las políticas en Supabase. La función `confirmar_compra` debe insertar la venta, las entradas y, si existen, los productos de `detalle_venta` como una operación consistente.

## Configuración local

1. Cloná el repositorio e instalá dependencias:

   ```bash
   npm install
   ```

2. Configurá la URL y la clave pública de Supabase en `src/environments/environment.ts`:

   ```ts
   export const environment = {
     production: false,
     supabaseUrl: 'https://TU-PROYECTO.supabase.co',
     supabasePublishableKey: 'TU_CLAVE_PUBLICA',
   };
   ```

   La clave publicable se usa desde el navegador y no reemplaza las políticas RLS. **Nunca incluyas una `service_role` key ni otra clave secreta en el frontend o en Git.**

3. En Supabase, habilitá los métodos de autenticación que usa la app: correo/contraseña y acceso anónimo para compras como invitado. Configurá las políticas y RPC de acuerdo con las tablas de ventas, entradas, funciones, productos y detalle de venta.

4. Iniciá el servidor local:

   ```bash
   npm start
   ```

   Abrí `http://localhost:4200/`.

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm start` | Ejecuta el servidor de desarrollo de Angular. |
| `npm run build` | Genera la compilación de producción en `dist/`. |
| `npm run watch` | Compila en modo desarrollo y observa cambios. |
| `npm test` | Ejecuta las pruebas configuradas con Vitest. |

## Rutas principales

| Ruta | Uso |
| --- | --- |
| `/inicio` | Portada. |
| `/cartelera` | Búsqueda y filtro de películas. |
| `/detalle/:id` | Detalle de película y funciones. |
| `/seleccionar-butacas/:id` | Mapa y selección de asientos de una función. |
| `/compra` | Resumen, productos, método de pago de prueba y confirmación. |
| `/candy-bar` | Selección de productos para agregar al carrito. |
| `/mis-compras` | Historial de clientes registrados. El guard actual verifica sesión y el servicio rechaza usuarios anónimos. |
| `/login` y `/registro` | Acceso y creación de cuenta. |

## Temas de la cursada en el proyecto

- **Rutas y lazy loading:** configuración en `src/app/app.routes.ts` y rutas hijas de detalle y butacas.
- **Servicios:** servicios de películas, funciones, salas, butacas, carrito, autenticación y ventas.
- **Input/Output:** el componente de película recibe la película seleccionada y emite el evento al padre.
- **Supabase:** autenticación, consultas a tablas y llamadas RPC.
- **Guards:** protección de la ruta `/mis-compras`.
- **Pipes:** formato de importes con `CurrencyPipe`.
- **Formularios reactivos y Validators:** registro y captura de fecha de nacimiento para la validación de edad.
- **Signals:** estado local y compartido reactivo.

La aplicación utiliza actualmente el cliente de Supabase con `async`/`await`; no usa `HttpClient` ni `Observable` para esas consultas. La estructura es standalone y no usa módulos `NgModule`. Esas diferencias pueden explicarse en la defensa como decisiones de implementación frente a otros enfoques vistos durante la cursada.

## Pendientes conocidos

- Panel y permisos de administración para películas, funciones, salas, productos y precios.
- Validación e invalidación de QR para entradas y entrega de Candy Bar.
- Cancelaciones y crédito para futuras compras.
- Cupones configurables, crédito de cuenta y sistema de puntos/recompensas.
- Reseñas, calificaciones, alertas de estrenos y sección «Mis películas».
- Reportes, estadísticas y registro de actividad administrativa.
- Asignación automática de salas y reglas completas de programación de funciones.
- PWA, configuración y despliegue en Firebase.

