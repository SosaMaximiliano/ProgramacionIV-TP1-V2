# Cinéfila — sistema de gestión de cine

Aplicación web desarrollada como trabajo práctico de Programación IV. Permite consultar películas y funciones, seleccionar butacas, comprar entradas y productos del Candy Bar, y consultar compras de clientes registrados.

## Estado del proyecto

La aplicación está desarrollada con Angular, conectada a Supabase, configurada como PWA y desplegada en Firebase Hosting. El flujo de compra usa pagos simulados. El QR generado es informativo: todavía no valida entradas ni entregas del Candy Bar.

## Tecnologías

- Angular 22 con componentes standalone, signals y rutas lazy-loaded.
- TypeScript y formularios reactivos.
- Supabase Auth y PostgreSQL como backend.
- `qrcode` para generar una imagen QR de referencia de la compra.
- Angular Service Worker para la PWA.
- Firebase Hosting para el despliegue.
- CSS propio para una interfaz responsive.

## Funcionalidades implementadas

- Cartelera con búsqueda por texto y filtro por género.
- Inicio con tres películas más vendidas y próximos estrenos dentro de las cuatro semanas siguientes.
- CRUD administrativo de películas y funciones.
- Asignación automática de salas y validación en el cliente del tiempo entre funciones.
- Funciones con fecha, hora, precio, idioma y tipo de proyección.
- Detalle de película con reseñas, calificaciones y promedio.
- Mapa de butacas con estados visuales, sectores accesibles y VIP, y consulta de ocupación.
- Validación de edad y aviso de acompañamiento cuando corresponde.
- Compra de entradas como usuario registrado o invitado, con métodos de pago simulados.
- Carrito y compra de productos del Candy Bar junto con las entradas.
- Descuento de bienvenida del 20 % para la primera compra de una cuenta registrada.
- Registro de ventas, entradas y productos en Supabase.
- Sección «Mis compras» para clientes registrados.
- Generación de QR informativo al confirmar la compra.

La compra delega la operación de escritura a la función PostgreSQL `confirmar_compra`, invocada mediante RPC. La disponibilidad de butacas se consulta con `obtener_butacas_ocupadas`. Las funciones y políticas deben existir en el proyecto Supabase.

**Limitaciones actuales:** el QR no invalida entradas ni registra entregas; el pago no procesa cobros reales; y la validación del intervalo entre funciones se realiza en el cliente, por lo que todavía no evita conflictos entre operaciones simultáneas.

## Funcionalidades pendientes

- Validación de entradas y entrega de Candy Bar por QR, con invalidación tras su uso.
- Cancelación de compras y generación de crédito.
- Cupones configurables, combos, puntos y recompensas.
- CRUD administrativo de salas, butacas, productos del Candy Bar, categorías y precios.
- Alertas de estrenos y sección «Mis películas».
- Reportes, estadísticas y registro de actividad administrativa.
- Propuestas de películas de clientes y moderación administrativa.
- Roles configurables por permisos y asignación a usuarios.
- Lista de espera con notificación push y plazo para comprar.
- Cancelación de funciones con acreditación atómica y opción de reubicación.

## Arquitectura

```text
src/
├── app/
│   ├── components/   # Pantallas y componentes visuales
│   ├── guards/       # Protección de rutas
│   ├── models/       # Interfaces y tipos del dominio
│   └── services/     # Acceso a Supabase y lógica compartida
├── environments/     # Configuración de entorno
└── styles.css        # Estilos globales
```

La aplicación usa componentes standalone. Las rutas cargan componentes de forma diferida con `loadComponent` y `loadChildren`. Los servicios encapsulan el acceso a Supabase y la lógica compartida. La interfaz usa signals para el estado reactivo local y `async`/`await` para las operaciones asíncronas.

### Decisiones técnicas

- **Supabase:** gestiona autenticación y persistencia. Las políticas RLS y los grants protegen las tablas expuestas a la aplicación.
- **Compra atómica:** `confirmar_compra` registra venta, entradas y, si corresponde, detalles de productos en una operación de base de datos.
- **Compra invitada:** se permite una sesión anónima de Supabase para comprar sin crear una cuenta. Las compras anónimas no integran el historial de una cuenta registrada.
- **Sesión:** el cliente Supabase usa `persistSession: false`; la sesión no se conserva al recargar la aplicación.
- **Roles:** el acceso de administrador se valida con un guard y el rol almacenado en `profiles`. La configuración granular de permisos está pendiente.
- **QR:** se genera en el navegador y contiene información de referencia. No debe tratarse como una credencial segura de uso único.
- **Pagos:** las opciones actuales son de prueba y no realizan cobros.

## Requisitos previos

- Node.js y npm compatibles con Angular CLI 22.
- Proyecto Supabase con las tablas, relaciones, permisos RLS, grants y funciones RPC que consume la aplicación.
- Credenciales publicables de Supabase.

La estructura SQL completa de Supabase no está incluida en este repositorio. La función `confirmar_compra` debe insertar la venta, las entradas y los productos de `detalle_venta` de forma consistente.

## Configuración local

1. Instalá las dependencias:

   ```bash
   npm install
   ```

2. Configurá la URL y la clave publicable en `src/environments/environment.ts`:

   ```ts
   export const environment = {
     production: false,
     supabaseUrl: 'https://TU-PROYECTO.supabase.co',
     supabasePublishableKey: 'TU_CLAVE_PUBLICA',
   };
   ```

   La clave publicable se utiliza desde el navegador y no reemplaza las políticas RLS. No incluyas claves `service_role` ni otros secretos en el frontend o en Git.

3. En Supabase, habilitá correo/contraseña y acceso anónimo. Configurá las políticas, grants y RPC según las tablas que usa la aplicación.

4. Iniciá el servidor:

   ```bash
   npm start
   ```

   Abrí `http://localhost:4200/`.

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm start` | Inicia el servidor de desarrollo. |
| `npm run build` | Genera la compilación de producción en `dist/`. |
| `npm run watch` | Compila en modo desarrollo y observa cambios. |
| `npm test` | Ejecuta las pruebas configuradas con Vitest. |

## Rutas principales

| Ruta | Uso |
| --- | --- |
| `/inicio` | Inicio, películas más vendidas y próximos estrenos. |
| `/cartelera` | Búsqueda y filtro de películas. |
| `/detalle/:id` | Detalle, reseñas y funciones de una película. |
| `/seleccionar-butacas/:id` | Mapa y selección de butacas. |
| `/compra` | Resumen, Candy Bar, método de pago de prueba y confirmación. |
| `/candy-bar` | Selección de productos para agregar al carrito. |
| `/mis-compras` | Historial de compras de una cuenta registrada. |
| `/admin/peliculas` | Gestión administrativa de películas. |
| `/admin/funciones` | Gestión administrativa de funciones. |
| `/login` y `/registro` | Acceso y creación de cuenta. |

## Temas de la cursada

- **Rutas y lazy loading:** `src/app/app.routes.ts` y rutas hijas de películas y selección de butacas.
- **Servicios:** películas, funciones, salas, butacas, carrito, autenticación, perfiles, reseñas y ventas.
- **Input/Output:** el componente de película recibe una película y emite el evento de selección.
- **Supabase:** autenticación, consultas y llamadas RPC.
- **Firebase:** Hosting y publicación de la aplicación.
- **Guards:** rutas de compras y administración.
- **Pipes:** formato de importes con `CurrencyPipe` y promedio de reseñas con `DecimalPipe`.
- **Formularios reactivos y Validators:** registro, validación de edad, películas, funciones y reseñas.
- **Directivas:** control de flujo moderno de Angular (`@if`, `@for`) y enlaces de formulario.
- **PWA:** manifiesto, iconos y Angular Service Worker.
- **Signals:** estado local y compartido reactivo.

La aplicación usa `async`/`await` para las consultas de Supabase; no utiliza `HttpClient` ni `Observable` para ese acceso. Su arquitectura es standalone y no utiliza módulos `NgModule`. Estas decisiones se pueden explicar en la defensa comparándolas con otros enfoques vistos en la cursada.
