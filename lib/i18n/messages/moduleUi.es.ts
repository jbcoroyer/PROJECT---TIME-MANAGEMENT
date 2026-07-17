/** Module UI strings (Spanish) — merged into es.ts patch */
export const moduleUiEs = {
  upgrade: {
    starter: {
      title: "Pase al plan Starter",
      body: "El plan Gratuito permite un máximo de 5 módulos. Desbloquee los 11 módulos con Starter (2 a 5 colaboradores).",
      cta: "Ver oferta Starter →"
    },
    pro: {
      title: "Este módulo requiere el plan Pro",
      body: "Pase al plan Pro para el asistente IA, Outlook, alertas de Slack y hasta 25 colaboradores.",
      cta: "Ver ofertas Pro →"
    },
    close: "Cerrar"
  },
  asks: {
    nav: {
      ariaLabel: "Navegación del espacio de solicitudes",
      hub: "Espacio de solicitudes",
      triage: "Procesar solicitudes",
      allForms: "← Todos los formularios",
    },
    hub: {
      defaultTitle: "Solicitudes {appName}",
      defaultWelcomeMessage:
        "Describe tu necesidad de comunicación. Nuestro equipo evaluará tu solicitud antes de gestionarla.",
      toast: {
        ready: "Su espacio de solicitudes está listo.",
        linkCopied: "Enlace copiado.",
        copyFailed: "Copia imposible.",
        urlUpdated: "URL pública actualizada.",
      },
      backToList: "Volver a todos los formularios",
      create: {
        title: "Cree su espacio de solicitudes",
        description:
          "Configura un formulario para clientes que puedes compartir por enlace. Las personas externas pueden enviar solicitudes sin acceder al resto de {appName}.",
        howItWorks: {
          title: "Cómo funciona",
          step1: "Crea tu formulario (título y mensaje de bienvenida)",
          step2: "Comparte el enlace público con tus clientes o socios",
          step3: 'Gestiona las solicitudes recibidas desde la pestaña "Procesar solicitudes"'
        },
        formTitleLabel: "Título del formulario",
        formTitlePlaceholder: "p. ej. Solicitudes de comunicación",
        welcomeMessageLabel: "Mensaje de bienvenida",
        submitting: "Creando…",
        submit: "Crear mi espacio de solicitudes"
      },
      noWelcomeMessage: "Sin mensaje de bienvenida.",
      editForm: "Editar formulario",
      publicLink: {
        title: "Enlace público para compartir",
        description:
          "Cualquiera con este enlace puede enviar una solicitud. Solo tendrá acceso a este formulario, no al espacio de trabajo de {appName}.",
        urlAriaLabel: "URL del formulario público",
        slugLabel: "URL personalizada",
        slugAriaLabel: "Segmento de URL",
        saveSlug: "Guardar URL",
        saving: "Guardando…",
        copied: "Copiado",
        copy: "Copiar",
        preview: "Vista previa"
      },
      cards: {
        editFields: {
          title: "Editar campos",
          description: "Añade, elimina y reordena las preguntas del formulario público.",
          cta: "Abrir editor"
        },
        triage: {
          title: "Procesar solicitudes",
          empty: "Ninguna solicitud por ahora",
          countOne: "{count} solicitud recibida",
          countMany: "{count} solicitudes recibidas",
          cta: "Abrir cola de triaje"
        }
      },
      externalAccess: {
        title: "Acceso externo",
        description:
          "Los clientes completan el formulario público. Recibes las solicitudes en tu cola de triaje y luego las conviertes en tareas."
      }
    },
    triage: {
      backToForm: "Volver al formulario",
      filteredBy: "Solicitudes de « {title} »",
      toast: {
        taskCreateFailed: "Creación imposible: {message}",
        unknownError: "error desconocido",
        converted: "Solicitud convertida en tarea"
      },
      defaultColumn: "Por hacer"
    },
    editor: {
      backLabel: "Volver al formulario",
      saveSuccess: "Formulario guardado."
    },
    list: {
      title: "Formularios de solicitud",
      subtitle:
        "Crea, edita y comparte formularios públicos autónomos. Cada formulario tiene su enlace y su cola de triaje.",
      newForm: "Nuevo formulario",
      cancel: "Cancelar",
      createSubmit: "Crear formulario",
      open: "Abrir",
      duplicate: "Duplicar",
      delete: "Eliminar",
      deleteConfirm:
        "¿Eliminar este formulario? Las solicitudes recibidas se conservarán pero quedarán desvinculadas.",
      active: "Activo",
      draft: "Borrador",
      createdOn: "Creado el {date}",
      emptyTitle: "Sin formularios",
      emptyBody:
        "Crea tu primer formulario de solicitud para recibir envíos de clientes o socios.",
      toast: {
        duplicated: "Formulario duplicado.",
        deleted: "Formulario eliminado."
      }
    },
    public: {
      success: {
        title: "Solicitud enviada",
        message:
          "Tu solicitud se ha enviado a {appName}. Te contactaremos en breve.",
        submitAnother: "Enviar otra solicitud"
      },
      badge: "Formulario público",
      defaultWelcome:
        "Describe tu necesidad. El equipo de {appName} evaluará tu solicitud antes de gestionarla.",
      submit: "Enviar solicitud",
      footer:
        "Acceso limitado a este formulario: no tienes acceso al resto de la plataforma."
    },
    templates: {
      picker: {
        title: "Partir de una plantilla o formulario en blanco",
        description:
          "Elige una plantilla precargada con preguntas habituales o un formulario en blanco para personalizar.",
        ariaLabel: "Plantillas de formulario de solicitud",
        meta: "{count} campos · ~{minutes} min"
      },
      blank: {
        name: "Formulario en blanco",
        description: "Formulario mínimo para construir campo a campo.",
        defaultTitle: "Solicitudes {appName}",
        defaultWelcome:
          "Describe tu necesidad. Nuestro equipo evaluará tu solicitud antes de gestionarla."
      },
      project: {
        name: "Solicitud de proyecto",
        description: "Nombre, plazo, presupuesto, prioridad y descripción del proyecto.",
        defaultTitle: "Solicitudes de proyecto {appName}",
        defaultWelcome:
          "Describe tu proyecto: objetivos, plazos y restricciones. Te responderemos pronto.",
        sectionTitle: "Tu proyecto"
      },
      general_inquiry: {
        name: "Consulta general",
        description: "Contacto simple: asunto, servicio y mensaje.",
        defaultTitle: "Contacto {appName}",
        defaultWelcome:
          "Formula tu pregunta o comparte tu necesidad. Te responderemos lo antes posible.",
        sectionTitle: "Tu mensaje"
      },
      support: {
        name: "Soporte y asistencia",
        description: "Reportar un problema con categoría, urgencia e impacto.",
        defaultTitle: "Soporte {appName}",
        defaultWelcome:
          "Describe tu problema o solicitud de asistencia. Indica la urgencia para un tratamiento adecuado.",
        sectionTitle: "Tu solicitud de soporte"
      },
      creative_brief: {
        name: "Brief creativo",
        description: "Campaña, entregables, referencias y guía de marca.",
        defaultTitle: "Brief creativo {appName}",
        defaultWelcome:
          "Comparte el contexto, los entregables esperados y tus restricciones creativas.",
        sectionTitle: "Tu brief"
      },
      fields: {
        firstName: "Nombre",
        firstNamePlaceholder: "Ej. María",
        lastName: "Apellido",
        lastNamePlaceholder: "Ej. García",
        email: "Correo electrónico",
        phone: "Teléfono",
        phonePlaceholder: "Ej. +34 612 345 678",
        company: "Empresa",
        projectName: "Nombre del proyecto",
        projectNamePlaceholder: "Ej. Campaña feria VIV Europe",
        requestType: "Tipo de solicitud",
        requestTypePlaceholder: "Ej. Creación, rediseño, producción…",
        priority: "Prioridad",
        deadline: "Plazo",
        budget: "Presupuesto estimado",
        budgetPlaceholder: "Ej. 5 000 € o rango",
        deliverableFormat: "Formato del entregable",
        projectDescription: "Descripción del proyecto",
        projectDescriptionPlaceholder: "Contexto, objetivos, público, restricciones…",
        subject: "Asunto",
        subjectPlaceholder: "Ej. Solicitud de información",
        department: "Servicio concernido",
        responseChannel: "Canal de respuesta preferido",
        desiredDate: "Fecha deseada",
        desiredDateHelp: "Fecha en la que deseas una respuesta o entrega.",
        message: "Mensaje",
        messagePlaceholder: "Detalla tu solicitud…",
        issueSubject: "Asunto del problema",
        issueSubjectPlaceholder: "Ej. No puedo acceder al portal",
        issueCategory: "Categoría",
        urgency: "Urgencia",
        impact: "Impacto",
        resolutionDeadline: "Fecha deseada de resolución",
        issueDescription: "Descripción del problema",
        issueDescriptionPlaceholder: "Pasos para reproducir, mensajes de error…",
        campaignName: "Nombre de campaña / proyecto",
        campaignNamePlaceholder: "Ej. Lanzamiento producto Q4",
        supportType: "Tipo de soporte",
        supportTypePlaceholder: "Ej. Flyer, visual redes, roll-up…",
        mainFormat: "Formato principal",
        deliverables: "Entregables esperados",
        deliverablesPlaceholder: "Lista de archivos o soportes a producir…",
        briefContext: "Contexto y objetivos",
        briefContextPlaceholder: "Público, tono, restricciones, mensajes clave…",
        references: "Referencias e inspiración",
        referencesPlaceholder: "Enlaces, moodboards, ejemplos…",
        brandGuidelines: "Guía de marca y restricciones",
        brandGuidelinesPlaceholder: "Colores, tipografías, prohibiciones…"
      },
      options: {
        priority: {
          "0": "Baja",
          "1": "Normal",
          "2": "Alta",
          "3": "Urgente"
        },
        deliverableFormat: {
          "0": "A4 impresión",
          "1": "PDF",
          "2": "Cuadrado Instagram 1080×1080",
          "3": "Story Instagram 1080×1920",
          "4": "Post LinkedIn 1200×627"
        },
        responseChannel: {
          "0": "Correo",
          "1": "Teléfono",
          "2": "Videollamada"
        },
        department: {
          "0": "Comunicación",
          "1": "Marketing",
          "2": "Comercial",
          "3": "Dirección",
          "4": "Otro"
        },
        issueCategory: {
          "0": "Acceso y cuenta",
          "1": "Error de aplicación",
          "2": "Hardware",
          "3": "Red",
          "4": "Otro"
        },
        urgency: {
          "0": "Baja — puede esperar",
          "1": "Media — en 48 h",
          "2": "Alta — bloqueante"
        },
        impact: {
          "0": "Individual",
          "1": "Equipo",
          "2": "Organización"
        },
        creativeFormat: {
          "0": "A4 impresión",
          "1": "PDF",
          "2": "Cuadrado Instagram 1080×1080",
          "3": "Story Instagram 1080×1920",
          "4": "Post LinkedIn 1200×627",
          "5": "Otro"
        }
      }
    }
  },
  damModule: {
    badge: "Biblioteca de activos",
    title: "Archivos y visuales compartidos",
    subtitle:
      "Centraliza logotipos, visuales y plantillas por marca, con búsqueda por etiquetas.",
    addTitle: "Añadir un activo",
    name: "Nombre",
    url: "URL (almacenamiento de Supabase, Drive…)",
    tags: "Etiquetas (separadas por comas)",
    add: "Añadir",
    search: "Buscar por nombre, marca o etiqueta…",
    emptyAssets: "No hay activos. Añade tus primeras visuales.",
    emptySearch: "No hay resultados para esta búsqueda.",
    delete: "Eliminar"
  },
  okrModule: {
    badge: "Objetivos",
    title: "OKR vinculados a tareas",
    subtitle:
      "Vincula cada resultado clave a un dominio para calcular el progreso automáticamente.",
    newObjective: "Nuevo objetivo",
    objectivePlaceholder: "Objetivo (p. ej., fortalecer el reconocimiento de marca digital)",
    group: "Grupo",
    period: "Periodo",
    create: "Crear",
    empty: "Ningún objetivo definido.",
    delete: "Eliminar",
    progressAuto: "{current}/{target} (automático)",
    linkedDomain: "Vinculado al dominio {domain}",
    krPlaceholder: "Resultado clave",
    manual: "Modo manual",
    target: "Objetivo",
    addKr: "KR"
  },
  events: {
    badge: "Eventos",
    title: "RETEX de evento",
    subtitle:
      "Aspectos destacados, áreas de mejora y acciones de seguimiento después de cada evento.",
    sidebarTitle: "Eventos",
    loading: "Cargando…",
    emptyList: "Ningún evento.",
    statusClosed: " · cerrado",
    taskProgress: "Avance de tareas: {pct} %",
    reportTitle: "Informe",
    highlightsLabel: "Puntos fuertes",
    highlightsPlaceholder: "Qué funcionó bien…",
    improvementsLabel: "A mejorar",
    improvementsPlaceholder: "Puntos problemáticos, feedback del terreno…",
    followUpsLabel: "Acciones de seguimiento",
    followUpsPlaceholder: "Decisiones y próximos pasos…",
    generatedTitle: "RETEX generado",
    enrichAi: "Enriquecer con IA",
    copy: "Copiar",
    selectEvent: "Selecciona un evento para escribir su RETEX.",
    toast: {
      aiError: "Enriquecimiento IA imposible",
      copied: "RETEX copiado",
      copyError: "Copia imposible"
    },
    ai: {
      eventLine: "Evento: {name} ({location})",
      locationFallback: "lugar n/d",
      progressLine: "Progreso de tareas: {pct}%",
      highlightsLine: "Aspectos destacados: {text}",
      improvementsLine: "A mejorar: {text}",
      followUpsLine: "Acciones de seguimiento: {text}",
      prompt: "Escribe un RETEX estructurado con recomendaciones concretas."
    }
  },
  todoModule: {
    badge: "Mi espacio",
    greeting: "Hola {name}",
    titleFallback: "Mi agenda",
    introPart1: "Aquí: tu ",
    introAgenda: "agenda diaria",
    introPart2:
      " (franjas horarias generadas automáticamente). Para la lista completa de tus tareas con fecha límite, usa ",
    introMyTasks: "Mis tareas",
    introPart3: " en el panel.",
    openMyTasks: "Abrir Mis tareas",
    timeBlockedTitle: "Planificación por bloques",
    plannedHours: "{hours} h de trabajo planificado",
    loginPrompt: "Inicie sesión para generar su agenda personalizada.",
    emptyPlan: "Ninguna tarea que planificar hoy. ¡Disfrute!",
    aiSectionTitle: "Impulso IA",
    optimize: "Optimizar",
    aiEmptyHint: "Ejecuta « Optimizar » para obtener consejos de organización para tu día.",
    toast: {
      aiError: "Enriquecimiento IA imposible"
    },
    ai: {
      noTasksToday: "Ninguna tarea asignada hoy",
      agendaTitle: "Mi agenda para {date}",
      prompt: "Da 2-3 consejos para optimizar este día (agrupación, orden y energía)."
    }
  },
  planning: {
    badge: "Planificación",
    title: "Retroplanificación y carga",
    subtitle:
      "Marketing Gantt, vistas de semana, mes y carga — por tarea, persona, dominio o modo.",
    conflictsCount: "{count} conflicto(s)",
    noConflicts: "Sin conflictos",
    views: {
      retroplanning: "Retroplanificación",
      week: "Semana",
      month: "Mes",
      workload: "Carga"
    },
    nav: {
      previous: "Anterior",
      next: "Siguiente"
    },
    range: {
      retroWeeks: "Sem {startWeek} – {endWeek} · {year}",
      weekOf: "Semana del {date}"
    },
    unassigned: "Sin asignar",
    workload: {
      empty: "Ninguna carga planificada.",
      personHeader: "Persona",
      hoursTitle: "{hours} h de carga"
    },
    conflicts: {
      title: "Conflictos y reequilibrio",
      overload: "Sobrecarga",
      overlap: "Solapamiento"
    },
    gantt: {
      defaultTitle: "Planificación inversa detallada",
      group: {
        tasks: "Tareas",
        person: "Por persona",
        domain: "Por dominio",
        mode: "Por modo"
      },
      empty: {
        title: "Tareas sin fecha",
        body: "Añade fechas límite o franjas planificadas en tus tareas para alimentar la planificación inversa."
      },
      columnHeader: "Tareas",
      today: "Hoy",
      footer:
        "Semanas · línea vertical = hoy · barras = duración planificada (franjas o fecha límite)"
    }
  },
  social: {
    badge: "Redes sociales",
    title: "Estudio y validaciones",
    subtitle: "Vista previa realista, flujo de aprobación y reorientación con IA.",
    allCompanies: "Todas las empresas",
    tabs: {
      validation: "Validación visual",
      studio: "Estudio IA",
      insights: "Mejor horario",
      recycle: "Reciclaje"
    },
    status: {
      idea: "Propuesta",
      writing: "Redacción",
      toValidate: "Pendiente de validación",
      scheduled: "Programado",
      published: "Publicado",
      cancelled: "Cancelado"
    },
    validation: {
      title: "Pendiente de validación y redacción",
      emptyTitle: "Nada que validar",
      emptyBody:
        "Las publicaciones marcadas como « Pendiente de aprobación » o « Redacción » aparecerán aquí.",
      selectPost: "Seleccione una publicación a la izquierda para previsualizarla.",
      approve: "Aprobar",
      requestChanges: "Solicitar cambios",
      reject: "Rechazar"
    },
    noNetwork: "sin red",
    loading: "Cargando…",
    insights: {
      noData:
        "Aún no hay suficientes publicaciones publicadas con métricas de interacción para recomendar una franja horaria.",
      bestDays: "Mejores días",
      bestHours: "Mejores horas",
      noMetrics: "Sin datos.",
      recommendation:
        "Publica preferiblemente el {day} alrededor de las {hour} (mejor interacción observada).",
      weekdays: {
        sunday: "Domingo",
        monday: "Lunes",
        tuesday: "Martes",
        wednesday: "Miércoles",
        thursday: "Jueves",
        friday: "Viernes",
        saturday: "Sábado"
      }
    },
    recycle: {
      title: "Biblioteca de publicaciones destacadas",
      empty:
        "Aún no hay publicaciones publicadas con métricas. Tu mejor contenido aparecerá aquí para reciclaje continuo.",
      button: "Reciclar",
      engagement: "compromiso"
    },
    preview: {
      visualPlaceholder: "Vista previa visual",
      visualAlt: "Imagen",
      textPlaceholder: "Tu texto aparecerá aquí…",
      facebookNow: "Ahora mismo · 🌎",
      linkedinNow: "Ahora mismo",
      like: "Me gusta",
      comment: "Comentar",
      share: "Compartir",
      repost: "Republicar",
      send: "Enviar"
    },
    repurpose: {
      title: "Repurposing IA",
      subtitle: "Un contenido fuente → una variante a medida por red.",
      backendOpenrouter: "IA de OpenRouter",
      backendLocal: "Generación local",
      sourcePlaceholder:
        "Pega un artículo, nota de prensa o idea de publicación…",
      generate: "Generar",
      copyAria: "Copiar",
      use: "Usar"
    },
    toast: {
      updateError: "Imposible actualizar la publicación",
      approved: "Publicación aprobada y programada",
      sentToWriting: "Devuelta a redacción",
      rejected: "Publicación rechazada",
      recycled: "Publicación reciclada (nueva idea programada en 30 días)",
      recycleError: "Imposible reciclar la publicación",
      generateError: "Generación imposible. Inténtelo de nuevo.",
      copied: "Copiado",
      copyError: "Copia imposible"
    }
  },
  agenda: {
    workspace: {
      badge: "Agenda dinámica",
      title: "Agenda y citas",
      subtitle:
        "Gestiona citas, notas de reuniones y reservas en línea. Tu calendario se actualiza en tiempo real con cada nueva reserva.",
      tabs: {
        calendar: "Calendario",
        requests: "Solicitudes RDV",
        booking: "Reserva",
        today: "Mi día"
      },
      stats: {
        today: "Hoy",
        upcoming: "Próximas",
        pending: "Solicitudes"
      },
      todayTab: {
        description:
          "Vista « Mi día »: agenda con franjas horarias generada a partir de tus tareas. Complementa el calendario de citas para una visión unificada de tu actividad."
      }
    },
    booking: {
      publicPage: {
        title: "Página de reserva pública",
        description:
          "Comparte este enlace para que los clientes soliciten una franja. Cada solicitud aparece en la pestaña Solicitudes RDV para su validación.",
        copied: "Copiado",
        copy: "Copiar",
        preview: "Vista previa",
        pause: "Pausar reservas",
        resume: "Reactivar reservas"
      },
      settings: {
        title: "Ajustes",
        publicTitle: "Título público",
        welcomeMessage: "Mensaje de bienvenida",
        slotDuration: "Duración de franja (min)",
        buffer: "Margen (min)",
        horizon: "Horizonte (días)",
        minNotice: "Preaviso mín. (h)",
        autoConfirm: "Confirmación automática (desactivada — las solicitudes requieren validación)",
        weeklyAvailability: "Disponibilidad semanal",
        saving: "Guardando…",
        save: "Guardar ajustes"
      },
      toast: {
        settingsSaved: "Ajustes de reserva guardados.",
        linkCopied: "Enlace copiado.",
        copyFailed: "Copia imposible."
      }
    },
    calendar: {
      loading: "Cargando calendario…",
      loadingShort: "Cargando…",
      today: "Hoy",
      prevMonthAria: "Mes anterior",
      nextMonthAria: "Mes siguiente",
      newAppointment: "Nueva cita",
      views: {
        list: "Lista",
        month: "Mes",
        week: "Semana",
        day: "Día"
      },
      messages: {
        today: "Hoy",
        previous: "Ant.",
        next: "Siguiente",
        month: "Mes",
        week: "Semana",
        day: "Día",
        agenda: "Lista",
        noEventsInRange: "Ninguna cita en este periodo."
      }
    },
    detail: {
      publicBookingSuffix: " · Reserva en línea",
      joinVideo: "Unirse a la videollamada",
      internalNotes: "Notas internas",
      loading: "Cargando…",
      noNotes: "Sin notas para esta cita.",
      notePlaceholder: "Notas de reunión, puntos de seguimiento, contexto…",
      saving: "Guardando…",
      addNote: "Añadir una nota",
      edit: "Editar",
      complete: "Completar",
      cancel: "Cancelar",
      toast: {
        noteAdded: "Nota añadida.",
        completed: "Cita marcada como completada.",
        cancelled: "Cita cancelada."
      }
    },
    form: {
      editTitle: "Editar cita",
      newTitle: "Nueva cita",
      titleLabel: "Título *",
      startLabel: "Inicio *",
      endLabel: "Fin *",
      hostLabel: "Anfitrión / responsable",
      unassigned: "Sin asignar",
      guestLabel: "Invitado",
      emailLabel: "Correo electrónico",
      phoneLabel: "Teléfono",
      messageLabel: "Mensaje / asunto",
      locationLabel: "Lugar",
      videoLinkLabel: "Enlace de videollamada",
      cancel: "Cancelar",
      saving: "Guardando…",
      save: "Guardar",
      create: "Crear cita",
      invalidRange: "La hora de fin debe ser posterior al inicio.",
      invalidDateTime: "Fecha u hora no válida.",
      toast: {
        updated: "Cita actualizada.",
        created: "Cita creada."
      }
    },
    public: {
      requestSubmitted: "Solicitud enviada",
      requestSubmittedMessage:
        "Tu solicitud de cita con {appName} ha sido recibida. Recibirás un correo de confirmación en {email} una vez validada la franja.",
      confirmed: "Reserva confirmada",
      confirmedMessage:
        "Tu franja con {appName} está reservada. Recibirás una confirmación en {email}.",
      slotDuration: "Franjas de {minutes} minutos",
      stepDate: "1. Elegir una fecha",
      stepTime: "2. Elegir un horario",
      stepContact: "3. Sus datos",
      loadingSlots: "Cargando franjas disponibles…",
      noSlots: "Ninguna franja disponible este día.",
      nameLabel: "Nombre *",
      emailLabel: "Correo electrónico *",
      phoneLabel: "Teléfono",
      messageLabel: "Asunto / mensaje",
      booking: "Reservando…",
      submitRequest: "Enviar solicitud",
      confirm: "Confirmar cita"
    },
    requests: {
      title: "Solicitudes de cita",
      pendingOne: "{count} solicitud pendiente",
      pendingMany: "{count} solicitudes pendientes",
      loading: "Cargando solicitudes…",
      emptyTitle: "Ninguna solicitud pendiente",
      emptyBody: "Las nuevas solicitudes desde su página pública aparecerán aquí.",
      review: "Tratar",
      recentTitle: "Solicitudes recientes",
      statusAccepted: "Aceptada",
      statusRejected: "Rechazada",
      panelEmptyTitle: "Seleccione una solicitud",
      panelEmptyBody: "Elija una solicitud para validarla, personalizar el correo de respuesta o rechazarla.",
      panelTitle: "Validación",
      emailSection: "Correo de confirmación al solicitante",
      locationLabel: "Lugar",
      locationPlaceholder: "Dirección, sala, consultorio…",
      videoLabel: "Enlace de videollamada",
      customMessageLabel: "Mensaje personalizado",
      customMessagePlaceholder: "Instrucciones, documentos a preparar, información adicional…",
      accept: "Validar y enviar",
      accepting: "Enviando…",
      reject: "Rechazar",
      rejectSection: "Rechazo (opcional)",
      rejectionReasonPlaceholder: "Motivo del rechazo…",
      notifyOnReject: "Notificar al solicitante por correo",
      toast: {
        accepted: "Cita confirmada y correo enviado.",
        rejected: "Solicitud rechazada."
      }
    },
    today: "Hoy",
    weekday: {
      sun: "Domingo",
      mon: "Lunes",
      tue: "Martes",
      wed: "Miércoles",
      thu: "Jueves",
      fri: "Viernes",
      sat: "Sábado"
    },
    status: {
      pending: "Pendiente",
      confirmed: "Confirmado",
      cancelled: "Cancelado",
      completed: "Completado"
    }
  },
  stock: {
    nav: {
      ariaLabel: "Navegación de stock",
      dashboard: "Panel",
      inventory: "Inventario",
      history: "Historial"
    },
    boutique: {
      badge: "Tienda interna",
      title: "Inventario y material",
      subtitle:
        "Explore su catálogo por categoría. Haga clic en un artículo para previsualizarlo y gestionar entradas / salidas.",
      kpi: {
        value: "Valor",
        refs: "Referencias",
        alerts: "Alertas"
      },
      search: {
        placeholder: "Buscar un artículo, tipo o idioma…",
        ariaLabel: "Búsqueda de inventario"
      },
      toolbar: {
        refresh: "Actualizar",
        sort: "Ordenar",
        viewGrid: "Vista cuadrícula",
        viewList: "Vista lista",
        history: "Historial",
        dashboard: "Panel",
        add: "Añadir"
      },
      sort: {
        alert: "Alertas primero",
        name: "Nombre (A→Z)",
        quantity: "Cantidad",
        value: "Valor"
      },
      category: {
        print: "Impresiones",
        goodies: "Regalos",
        plv: "PLV"
      },
      addMenu: {
        printDocument: "Documento print",
        plvSupport: "Soporte PLV"
      },
      filters: {
        all: "Todo",
        alertsOnly: "Solo alertas",
        species: "Especie",
        allSpecies: "Todo"
      },
      status: {
        reorder: "Reaprovisionar",
        inStock: "En stock"
      },
      actions: {
        entry: "Entrada",
        exit: "Salida",
        edit: "Editar",
        quoteInfo: "Presupuesto / info",
        delete: "Eliminar",
        enlarge: "Ampliar"
      },
      card: {
        inStock: "en stock",
        perUnit: "por unidad",
        units: "unidades",
        value: "valor",
        refsCount: "{count} ref."
      },
      visual: {
        replacePdf: "Reemplazar PDF",
        changePhoto: "Cambiar foto",
        addVisualTitle: "Añadir imagen o PDF",
        imageOrPdf: "Imagen o PDF",
        openPdf: "Abrir PDF",
        enlargeVisual: "Ampliar visual",
        closeVisual: "Cerrar visual"
      },
      detail: {
        quantity: "Cantidad",
        totalValue: "Valor total",
        unitPrice: "Precio unitario",
        alertThreshold: "Umbral de alerta",
        lastQuote: "Último presupuesto / info"
      },
      empty: {
        title: "Ningún artículo que mostrar",
        filtered: "No hay resultados para estos filtros. Prueba a ampliar tu búsqueda.",
        initial: "Empieza añadiendo un documento, regalos o un display POS."
      },
      close: "Cerrar",
      toast: {
        itemUpdated: "Artículo actualizado",
        itemCreated: "Artículo creado",
        multipleItemsCreated:
          "{count} artículos creados para este documento (uno por idioma).",
        saveItemError: "Imposible guardar el artículo.",
        saveItemsError: "Imposible guardar los artículos.",
        itemDeleted: "Artículo eliminado",
        deleteItemError: "Imposible eliminar el artículo.",
        stockEntryRecorded: "Entrada de stock registrada",
        stockExitRecorded: "Salida de stock registrada",
        movementError: "Imposible registrar el movimiento de stock.",
        infoSaved: "Información guardada",
        infoSaveError: "Imposible guardar la información.",
        uploadFailed: "Subida imposible.",
        uploadFailedWithError: "Falló la subida: {error}",
        pdfSaved: "PDF guardado",
        photoSaved: "Foto guardada",
        photoSaveError: "Imposible guardar la foto."
      },
      delete: {
        title: "¿Eliminar este artículo?",
        description:
          "El artículo « {name} » se eliminará del inventario. Esta acción no se puede deshacer."
      }
    },
    onboarding: {
      welcome: {
        title: "Configure su espacio de stock",
        body: "Antes de gestionar cantidades, indique qué tipos de soportes, productos o servicios quiere seguir. Podrá modificarlos después.",
        step1: "Elija sus categorías (sugerencias o etiquetas personalizadas)",
        step2: "Descubra cómo inventariar, alertar y registrar movimientos",
        step3: "Acceda a su tienda interna adaptada a su actividad",
        cta: "Empezar configuración"
      },
      categories: {
        title: "¿Qué stocks desea seguir?",
        description:
          "Le proponemos ideas, pero las etiquetas son suyas: adáptelas a su actividad (sin categorías impuestas).",
        suggestions: "Sugerencias",
        customLabel: "Añadir categoría personalizada",
        customPlaceholder: "Ej. Material eventos, Suministros…",
        add: "Añadir",
        selected: "{count} categoría(s) seleccionada(s)",
        remove: "Quitar {label}",
        minOne: "Seleccione al menos una categoría.",
        documents: "Documentos y soportes",
        documentsDesc: "Folletos, carteles, dossiers de prensa…",
        promotional: "Objetos promocionales",
        promotionalDesc: "Regalos, textiles, obsequios clientes…",
        signage: "Señalización y PLV",
        signageDesc: "Banners, roll-ups, paneles…",
        event_material: "Material de eventos",
        event_materialDesc: "Stands, mobiliario, técnica…",
        supplies: "Suministros y consumibles",
        suppliesDesc: "Papel, tinta, pequeño material…",
        services: "Prestaciones y servicios",
        servicesDesc: "Servicios externos seguidos como stock lógico"
      },
      tour: {
        badge: "Descubrimiento",
        title: "Cómo funciona la herramienta",
        description: "Esto es lo que podrá hacer una vez configurado su espacio.",
        launching: "Iniciando…",
        cta: "Lanzar mi espacio stock",
        features: {
          inventory: {
            title: "Tienda interna",
            body: "Visualice artículos por categoría, con fotos, cantidades y valor total."
          },
          movements: {
            title: "Entradas y salidas",
            body: "Registre cada movimiento e impute a un proyecto o evento."
          },
          alerts: {
            title: "Alertas de reposición",
            body: "Defina un umbral por artículo: el stock bajo se destaca."
          },
          history: {
            title: "Historial completo",
            body: "Vea quién movió qué, cuándo y por qué."
          },
          events: {
            title: "Vínculo eventos",
            body: "Reserve material desde sus fichas de evento."
          },
          ideas: {
            title: "Buzón de ideas",
            body: "Recoja sugerencias logísticas de su equipo."
          }
        }
      }
    },
    genericModal: {
      addTitle: "Añadir artículo",
      editTitle: "Modificar artículo",
      typeLabel: "Tipo / subcategoría",
      typePlaceholder: "Ej. Roll-up 85×200, Bolígrafos…",
      nameLabel: "Nombre del artículo",
      namePlaceholder: "Nombre exacto en inventario",
      unitPrice: "Precio unitario",
      alertThreshold: "Umbral de alerta",
      visualLabel: "Visual (imagen o PDF)",
      addVisual: "Añadir visual",
      nameRequired: "El nombre es obligatorio.",
      uploadFailed: "Subida imposible: {error}",
      create: "Añadir"
    }
  },
  eventsLegacy: {
    nav: {
      hub: "Centro de eventos",
      ariaLabel: "Navegación de eventos"
    },
    hub: {
      badge: "Espacio de eventos",
      title: "Centro de eventos",
      subtitle:
        "Vista consolidada: calendario de eventos, carga Kanban (tareas vinculadas) y presupuesto gastado durante el año.",
      refresh: "Actualizar",
      newEvent: "Nuevo evento",
      activeEvents: "Eventos activos",
      activeEventsHint: "Estados distintos de « Completado »",
      budgetEngaged: "Presupuesto gastado ({year})",
      budgetEngagedHint: "Gastos registrados + valoración de salida de stock",
      timelineTitle: "Cronología del evento",
      timelineHint: "Haz clic en una tarjeta para abrir el espacio de trabajo.",
      backToDashboard: "Volver al panel principal",
      loadingEvents: "Cargando eventos…",
      workloadTitle: "Carga (tareas del evento)",
      workloadHint: "Todas las tareas vinculadas a un evento también aparecen en el tablero Kanban principal.",
      deleteTitle: "¿Eliminar este evento?",
      deleteDescription:
        "« {name} » y todas sus tareas se eliminarán. Esta acción no se puede deshacer.",
      deleteConfirm: "Eliminar permanentemente",
      thisEvent: "este evento",
      toast: {
        deleted: "Evento eliminado"
      }
    },
    create: {
      duplicate: "Duplicar",
      newEvent: "Nuevo evento",
      fromExisting: "Crear a partir de un evento existente",
      createEvent: "Crear un evento",
      close: "Cerrar",
      new: "Nuevo",
      sourceEvent: "Evento de origen",
      choose: "Elegir…",
      copyTasks: "Copiar tareas (fechas límite desplazadas)",
      eventName: "Nombre del evento",
      namePlaceholderDuplicate: "Dejar en blanco = nombre + (copia)",
      namePlaceholderNew: "p. ej. Conferencia anual 2026",
      location: "Lugar",
      locationPlaceholder: "Dirección, sala, videollamada…",
      start: "Inicio",
      end: "Fin",
      status: "Estado",
      budget: "Presupuesto (€)",
      cancel: "Cancelar",
      creating: "Creando…",
      create: "Crear",
      copyName: "Evento (copia)",
      toast: {
        nameRequired: "Introduce el nombre del evento.",
        datesRequired: "Introduce las fechas de inicio y fin.",
        endAfterStart: "La fecha de fin debe ser posterior a la fecha de inicio.",
        sourceRequired: "Elige un evento para duplicar.",
        duplicated: "Evento duplicado",
        created: "Evento creado"
      }
    },
    detail: {
      tabs: {
        tasks: "Tareas y planificación",
        stock: "Equipamiento reservado",
        budget: "Seguimiento de presupuesto",
        documents: "Documentos"
      },
      ariaSections: "Secciones del evento",
      deleteTitle: "¿Eliminar el evento?",
      deleteConfirm: "Eliminar permanentemente",
      deleting: "Eliminando…",
      deleteEvent: "Eliminar evento",
      addTaskPlaceholder: "Añadir una tarea…",
      previewDoc: "Vista previa de {name}",
      defaultColumn: "Por hacer",
      backToHub: "Volver al centro",
      loading: "Cargando…",
      notFound: "Evento no encontrado.",
      deleteDescription:
        "« {name} » y todas sus tareas se eliminarán de forma permanente. Esta acción no se puede deshacer.",
      deleteDocTitle: "¿Eliminar este documento?",
      deleteDocDescription: "« {name} » se eliminará del evento.",
      eventKanban: "Kanban del evento",
      mainKanban: "Kanban principal",
      milestoneFilter: "Filtro de hitos: vencimiento ≤ {date}",
      categoryPlaceholder: "Categoría…",
      adding: "Añadiendo…",
      add: "Añadir",
      stockOutputs: "Salidas de stock asignadas",
      noStockOutputs: "No hay salidas para este evento.",
      quotesInvoices: "Presupuestos y facturas",
      documentsHint: "Adjuntos y recibos vinculados al evento.",
      noDocuments: "No hay documentos para este evento.",
      previewUnavailable: "Vista previa no disponible",
      unknownDate: "Fecha desconocida",
      uploadError: "Subida imposible.",
      deleteDocError: "Error al eliminar.",
      toast: {
        loadDocsError: "No se ha podido cargar los documentos del evento.",
        taskUpdated: "Tarea actualizada",
        updateError: "Error al actualizar.",
        deleted: "Evento eliminado",
        docsAdded: "Documento(s) añadido(s)",
        docDeleted: "Documento eliminado",
        taskTitleRequired: "Introduce el título de la tarea.",
        addCollaborator: "Añade al menos un colaborador activo en Ajustes.",
        taskAdded: "Tarea añadida",
        taskCreateError: "No se pudo crear la tarea."
      }
    },
    timeline: {
      empty: "Aún no hay eventos.",
      emptyScheduled: "No hay eventos programados. Crea un evento para mostrarlo aquí.",
      budget: "Presupuesto",
      budgetAllocated: "Presupuesto asignado:",
      preparation: "Preparación",
      overdue: "{count} vencidos",
      deleteTitle: "¿Eliminar evento?"
    },
    kanban: {
      empty: "No hay tareas de eventos.",
      emptyHint: "No hay tareas vinculadas a un evento. Añade tareas desde la página del evento.",
      taskCount: "{count} tarea(s)",
      emptyColumn: "Vacío",
      eventFallback: "Evento"
    },
    prep: {
      noTasks: "No hay tareas — añade tareas desde la pestaña Tareas y planificación.",
      taskCount: "{count} tareas vinculadas a este evento",
      progressTitle: "Progreso de preparación",
      tasksDone: "{done} / {total} tareas completadas",
      noOverdue: "Sin fechas límite vencidas",
      unscheduledOpen: "{count} tarea(s) abierta(s) sin fecha límite",
      eventBudget: "Presupuesto del evento",
      allocatedCap: "Límite asignado:"
    },
    milestone: {
      title: "Hitos de preparación",
      taskCount: "{count} tareas",
      taskCountOne: "{count} tarea"
    },
    detailKanban: {
      deadline: "Vence {date}",
      planning: "Planificación",
      empty: "No hay tareas. Usa el formulario de arriba o una plantilla al crear."
    },
    stock: {
      defaultReason: "Reserva del evento",
      defaultExitReason: "Salida de stock del evento",
      badge: "Reserva de stock",
      title: "Reservar equipamiento desde el stock",
      description:
        "Registrar una salida de stock vinculada a este evento (movimiento en el historial de stock).",
      loading: "Cargando stock…",
      item: "Artículo",
      quantity: "Cantidad a retirar",
      performedBy: "Realizado por",
      comment: "Comentar",
      submit: "Registrar salida",
      reserveTitle: "Reservar equipamiento (salida de stock)",
      reserveDescription:
        "Cada salida se registra en el historial de stock y se valora para el presupuesto del evento (precio unitario en el momento del movimiento).",
      selectPlaceholder: "— Seleccionar —",
      submitting: "Guardando…",
      toast: {
        chooseItem: "Elige un artículo de stock.",
        nameRequired: "Introduce tu nombre.",
        quantityExceeded: "La cantidad supera el stock disponible.",
        success: "Salida de stock asignada al evento",
        error: "Falló el movimiento."
      }
    },
    material: {
      toast: {
        saved: "Necesidad registrada",
        alreadyCovered: "Necesidad ya cubierta.",
        exitRecorded: "Salida de stock registrada",
        nothingToReturn: "No hay cantidad para devolver.",
        returnRecorded: "Devolución de stock registrada"
      },
      exitReason: "Evento — {item}",
      returnReason: "Devolución del evento — {item}",
      badge: "Necesidades de material ({count} pendientes)",
      hint: "Declara las necesidades de material antes de la salida de stock.",
      itemPlaceholder: "Artículo…",
      available: "{qty} disponible",
      add: "Añadir",
      loading: "Cargando…",
      empty: "No hay necesidades declaradas.",
      chooseItem: "Elige un artículo.",
      insufficientStock: "Stock insuficiente.",
      exitError: "Falló la salida.",
      returnError: "Falló la devolución.",
      listError: "Lista de necesidades no disponible.",
      fulfill: "Salida desde stock",
      return: "Devolver",
      ok: "OK",
      itemFallback: "Artículo"
    },
    runOfShow: {
      loadError: "Run of show no disponible (¿migración aplicada?).",
      newSlot: "Nuevo espacio",
      toast: {
        slotAdded: "Espacio añadido"
      },
      title: "Guion del evento",
      subtitle: "Agenda día a día ({count} día(s)).",
      slot: "Espacio",
      loading: "Cargando…",
      empty: "No hay espacios. Añade preparación, apertura, personal, cierre…",
      notes: "Notas",
      delete: "Eliminar"
    },
    taskPlanning: {
      title: "Espacios del calendario",
      closeAria: "Cerrar planificación",
      dayDuration: "Día (duración)",
      timeSlot: "Franja horaria",
      empty: "No hay espacios. Añade un día o una franja horaria.",
      allDay: "Todo el día",
      delete: "Eliminar",
      cancel: "Cancelar",
      saving: "Guardando…",
      save: "Guardar"
    },
    budget: {
      toast: {
        envelopesSaved: "Sobres de presupuesto guardados"
      },
      closedAt: "{date} — variación de presupuesto",
      closedOn: "Cerrado el",
      addExpense: "Añadir gasto",
      envelopesTitle: "Sobres de presupuesto",
      envelopesHint: "Tope por línea (alerta visual si se supera).",
      savingEnvelopes: "Guardando…",
      saveEnvelopes: "Guardar sobres",
      costDetail: "Detalle de costes",
      label: "Etiqueta",
      quoted: "Presupuesto",
      committed: "Comprometido",
      paid: "Pagado",
      post: "Línea",
      status: "Estado",
      material: "Equipo"
    },
    gauge: {
      used: "{pct}% del presupuesto asignado usado",
      noBudget: "Sin presupuesto asignado: el indicador refleja solo los costes registrados.",
      overBudget: "Presupuesto superado"
    },
    expense: {
      toast: {
        labelRequired: "Introduce una etiqueta.",
        saved: "Gasto registrado",
        saveError: "No se pudo registrar el gasto."
      },
      title: "Añadir gasto",
      label: "Etiqueta",
      quoted: "Presupuesto (€)",
      committed: "Comprometido (€)",
      paid: "Pagado (€)",
      category: "Categoría",
      budgetPost: "Línea de presupuesto",
      status: "Estado",
      saving: "Guardando…",
      save: "Guardar",
      cancel: "Cancelar"
    },
    closure: {
      placeholder: "Aspectos destacados, incidencias e ideas para la próxima edición…",
      closing: "Cerrando…",
      closeEvent: "Cerrar evento",
      title: "Cierre y resumen",
      allocatedBudget: "Presupuesto asignado",
      consumedTotal: "Total consumido",
      expenses: "Gastos",
      stockValue: "Valor del stock",
      tasksDone: "Tareas completadas",
      variance: "Variación",
      retexOptional: "RETEX (opcional)",
      cancel: "Cancelar",
      toast: {
        closed: "Evento cerrado"
      }
    },
    cover: {
      toast: {
        saved: "Imagen de portada guardada",
        removed: "Imagen eliminada"
      },
      imageRequired: "Elige una imagen (JPEG, PNG, WebP…).",
      alt: "Portada — {name}",
      addCover: "Añadir una imagen de portada",
      change: "Cambiar",
      add: "Añadir",
      remove: "Eliminar"
    }
  },
  survey: {
    common: {
      close: "Cerrar",
      cancel: "Cancelar",
      delete: "Eliminar",
      save: "Guardar",
      saving: "Guardando…",
      back: "Volver"
    },
    form: {
      requiredError: "Responde las preguntas obligatorias (*) antes de continuar.",
      submitting: "Enviando…",
      submit: "Enviar mis respuestas",
      loading: "Cargando encuesta…",
      back: "Volver",
      continue: "Continuar",
      introDuration: "Aprox. {minutes} min · {steps} pasos",
      start: "Empezar",
      stepProgress: "Paso {current} de {total}",
      thankYouName: "¡Gracias, {name}!",
      thankYouGeneric: "¡Muchas gracias!",
      thankYouBody:
        "Tus respuestas se han guardado. Ayudarán a {appName} a mejorar. ¡Gracias de verdad!"
    },
    rating: {
      low: "Ay, lo tendremos en cuenta.",
      midLow: "Hay margen de mejora.",
      mid: "¡No está mal!",
      high: "¡Genial!",
      top: "¡Excelente!"
    },
    hub: {
      titleEmpty: "El título no puede estar vacío.",
      renamed: "Encuesta renombrada.",
      backToList: "Volver a la lista",
      rename: "Renombrar",
      publicLink: "Enlace público:",
      createdMeta: "Creada el {date} · {count} respuesta(s)",
      openForm: "Abrir formulario",
      openFormDescription: "Ver o compartir el enlace público de la encuesta.",
      choose: "Elegir",
      cards: {
        edit: {
          title: "Editar preguntas",
          description: "Añadir, eliminar y reordenar preguntas y respuestas."
        },
        responses: {
          title: "Ver respuestas",
          description: "Ver estadísticas, gráficos y verbatim."
        }
      }
    },
    list: {
      title: "Encuestas",
      companyWide: "A nivel de empresa",
      commTeam: "Equipo de comunicación",
      commTeamSubtitle: "Reservado para miembros del departamento",
      groupCollaborators: "Empleados del grupo",
      custom: "Personalizada",
      customSubtitle: "Encuesta personalizada",
      placeholder: "p. ej. Encuesta Pulse 2026",
      newTitleLabel: "Nuevo título de la encuesta",
      creating: "Creando…",
      createAndConfigure: "Crear y configurar",
      active: "Activa",
      draft: "Borrador",
      createdOn: "Creada el {date}",
      screens: "{count} pantalla(s)",
      responses: "{count} respuesta(s)",
      questionCount: "{count} pregunta(s)",
      cardHint:
        "Cada tarjeta tiene un color según el público objetivo: empleados del grupo, equipo interno o una encuesta personalizada.",
      newSurvey: "Nueva encuesta",
      empty: "Aún no hay encuestas. Crea una con el botón de arriba.",
      loading: "Cargando encuestas…",
      toast: {
        created: "Encuesta creada."
      }
    },
    editor: {
      title: "Editor de formulario",
      back: "Volver a las encuestas",
      successDefault: "Formulario guardado.",
      successQuestionnaire: "Encuesta guardada.",
      screenCount: "{count} pantalla(s)",
      questionCount: "{count} pregunta(s)",
      welcomeScreen: "Pantalla de bienvenida",
      screenTitlePlaceholder: "Título de la pantalla",
      screenSubtitlePlaceholder: "Subtítulo (opcional)",
      moveScreenUp: "Mover pantalla arriba",
      moveScreenDown: "Mover pantalla abajo",
      deleteScreen: "Eliminar pantalla",
      dragHint:
        "Arrastra las preguntas por su asa para reordenarlas, incluso entre pantallas.",
      emptySection: "Aún no hay preguntas. Añade una debajo o arrastra una aquí.",
      moveQuestion: "Mover pregunta",
      duplicateQuestion: "Duplicar pregunta",
      deleteQuestion: "Eliminar pregunta",
      deleteQuestionTitle: "¿Eliminar esta pregunta?",
      deleteQuestionDescription: "La pregunta se eliminará de la encuesta.",
      deleteScreenTitle: "¿Eliminar esta pantalla?",
      deleteScreenDescription: "La pantalla y todas sus preguntas se eliminarán.",
      labelRequired: "Cada pregunta debe tener una etiqueta.",
      sectionDefault: "Sección {n}",
      copySuffix: " (copia)",
      optionDefault: "Opción {n}",
      questionLabel: "Etiqueta de pregunta",
      helpOptional: "Texto de ayuda (opcional)",
      answerOptions: "Opciones de respuesta",
      moveOption: "Mover opción",
      deleteOption: "Eliminar opción",
      addOption: "Añadir opción",
      showIfPrestation: "Mostrar si el servicio",
      addQuestion: "Añadir pregunta",
      addScreen: "Añadir pantalla",
      introTitle: "Título de bienvenida",
      introSubtitleLabel: "Subtítulo",
      screenLabel: "Pantalla {n}",
      duplicateQuestionAria: "Duplicar pregunta",
      minimum: "Mínimo",
      maximum: "Máximo",
      placeholderOptional: "Marcador de posición (opcional)",
      required: "Obligatorio",
      always: "Siempre",
      questionFallback: "Pregunta",
      types: {
        single: "Opción única",
        multiple: "Selección múltiple",
        rating: "Valoración (estrellas / escala)",
        nps: "Recomendación (NPS 0-10)",
        open: "Texto libre (largo)",
        text: "Campo corto"
      },
      typesShort: {
        single: "Opción única",
        multiple: "Selección múltiple",
        rating: "Valoración",
        nps: "NPS",
        open: "Texto libre",
        text: "Campo corto"
      }
    },
    responses: {
      title: "Respuestas",
      back: "Volver a la encuesta",
      export: "Exportar CSV",
      tabSummary: "Resumen",
      tabIndividual: "Respuestas individuales",
      filters: "Filtros",
      allEntities: "Todas las empresas",
      allServices: "Todos los departamentos",
      allPrestations: "Todos los servicios",
      allPeriod: "Todo el tiempo",
      last30: "Últimos 30 días",
      last90: "Últimos 90 días",
      last365: "Últimos 12 meses",
      loading: "Cargando respuestas…",
      empty: "Aún no hay respuestas. Comparte el",
      emptyLink: "enlace público",
      emptySuffix: "para recopilar feedback.",
      kpiResponses: "Respuestas",
      kpiSatisfaction: "Satisfacción media (/10)",
      kpiNps: "NPS",
      kpiPromoters: "Promotores / Detractores",
      distribution: "Distribución de respuestas",
      chartResponses: "Respuestas",
      ratingAverages: "Promedios por pregunta valorada",
      toast: {
        loadError: "No se han podido cargar las respuestas.",
        exportEmpty: "No hay respuestas para exportar.",
        exportDone: "Exportación CSV generada",
        deleted: "Respuesta eliminada"
      },
      deleteTitle: "¿Eliminar esta respuesta?",
      deleteDescription:
        "La respuesta se eliminará de forma permanente. Esta acción no se puede deshacer."
    },
    admin: {
      loading: "Cargando…",
      title: "Acceso solo para administradores",
      body: "La gestión de la encuesta está reservada para administradores.",
      backToDashboard: "Volver al panel"
    },
    charts: {
      noRatings: "No hay valoraciones para estos filtros.",
      average: "Promedio",
      noResponses: "No hay respuestas."
    },
    verbatims: {
      title: "Verbatim ({count})",
      allQuestions: "Todas las preguntas abiertas",
      search: "Buscar…",
      empty: "No hay verbatim para estos criterios."
    },
    responseList: {
      dateFormat: "d MMM yyyy 'a las' HH:mm",
      emptyFiltered: "No hay respuestas para mostrar con estos filtros.",
      responseNumber: "Respuesta #{n}",
      anonymous: "Anónimo",
      deleting: "Eliminando…"
    }
  },
  inventory: {
    common: {
      close: "Cerrar",
      cancel: "Cancelar",
      delete: "Eliminar",
      saving: "Guardando…",
      update: "Actualizar",
      create: "Crear",
      createLanguages: "Crear ({count} idiomas)",
      quantity: "Cantidad",
      unitPrice: "Precio unitario",
      alertThreshold: "Umbral de alerta",
      language: "Idioma",
      featuredLanguages: "Idiomas principales",
      otherLanguages: "Otros idiomas (más hablados)",
      preview: "Vista previa",
      chooseFile: "Elegir archivo",
      remove: "Quitar"
    },
    print: {
      badge: "Impresión",
      editTitle: "Editar documento",
      addTitle: "Añadir documento",
      docTypeRequired:
        "El tipo de documento es obligatorio (elije uno de la lista o introduce un tipo personalizado).",
      nameRequired: "El nombre del documento es obligatorio.",
      uploadError: "Falló la subida de la imagen: {error}",
      languageRequired: "El idioma es obligatorio.",
      duplicateLanguage: "El idioma « {lang} » aparece más de una vez.",
      addLanguageRow: "Añade al menos un idioma con una fila completa.",
      customTypePlaceholder:
        "Nuevo tipo — se mostrará en la lista para documentos futuros",
      species: "Especie",
      docName: "Nombre del documento",
      namePlaceholder: "Referencia o etiqueta interna (igual para todos los idiomas)",
      visualUrl: "URL de la imagen",
      visualFile: "Archivo de imagen",
      uploadLabel: "Importar imagen o PDF",
      previewName: "Vista previa del documento",
      qtyShort: "Cant.",
      priceShort: "Precio unitario",
      thresholdShort: "Umbral de alerta",
      addLanguage: "Añadir un idioma",
      otherOption: "Otro (entrada personalizada)…",
      langRowsTitle: "Idiomas y cantidades (una fila por idioma — mismo documento)",
      docType: "Tipo de documento",
      visualUrlOptional: "URL de la imagen o PDF (opcional)",
      toast: {}
    },
    plv: {
      badge: "PLV",
      editTitle: "Editar display POS",
      addTitle: "Añadir display POS",
      nameRequired: "El nombre es obligatorio.",
      typeRequired: "El tipo POS es obligatorio.",
      uploadError: "Falló la subida: {error}",
      customTypePlaceholder:
        "Nuevo tipo — se sugerirá en la lista la próxima vez",
      previewName: "Vista previa del visual POS",
      otherOption: "Otro (entrada personalizada)…",
      visualPreviewLabel: "Vista previa visual",
      supportType: "Tipo de display",
      namePlaceholder: "Nombre exacto del visual",
      visualUrlOptional: "URL de la imagen o PDF (opcional)",
      uploadLabel: "Importar imagen o PDF",
      chooseFile: "Elegir archivo",
      name: "Nombre",
      quantity: "Cantidad"
    },
    goodies: {
      previewName: "Vista previa de goodies",
      editTitle: "Editar goodies",
      addTitle: "Añadir goodies",
      name: "Nombre",
      type: "Tipo",
      visualUrl: "URL de la imagen",
      visualFile: "Archivo de imagen",
      uploadLabel: "Subir imagen"
    },
    reorder: {
      reorder: "Reordenar",
      stockOk: "Stock correcto",
      placeholder:
        "Referencia de presupuesto, precio anterior, cantidades mínimas, nombre de impresora, contacto, plazos…",
      quoteRequired: "Añade información de presupuesto o reorden.",
      currentQty: "Cantidad actual",
      infoBadge: "Último presupuesto / información de reorden",
      save: "Guardar"
    },
    toast: {
      fileError: "Archivo inválido."
    }
  },
  stockLegacy: {
    movement: {
      badge: "Movimiento de stock",
      entry: "Entrada",
      exit: "Salida",
      currentQty: "Cantidad actual: {qty}.",
      currentQtyMax: "Cantidad actual: {qty}. Puedes retirar hasta {max}.",
      howManyAdd: "¿Cuántos artículos añadir?",
      howManyRemove: "¿Cuántos artículos retirar?",
      who: "¿Quién eres?",
      yourName: "Tu nombre",
      project: "¿Para qué proyecto?",
      noProject: "Otro / Ninguno",
      reason: "Motivo",
      reasonAddPlaceholder: "p. ej. Reposición de proveedor",
      reasonRemovePlaceholder: "p. ej. Kit del evento, pérdida, regalo para el cliente",
      validateEntry: "Confirmar entrada de stock",
      validateExit: "Confirmar salida de stock",
      toast: {
        qtyRequired: "Introduce una cantidad mayor que 0.",
        qtyExceeded: "No puedes retirar más de la cantidad disponible.",
        userRequired: "Introduce quién realiza el movimiento."
      }
    },
    history: {
      badge: "Historial de stock",
      title: "Trazabilidad del movimiento",
      subtitle: "Todas las entradas y salidas de stock se listan aquí con persona, proyecto y motivo.",
      recent: "Movimientos recientes",
      count: "{count} movimiento(s) mostrado(s)",
      loading: "Cargando historial…",
      empty: "Aún no hay movimientos registrados.",
      entry: "Entrada",
      exit: "Salida",
      qtyAfter: "Cantidad tras el movimiento:",
      value: "Valor:",
      noProject: "Otro / Sin proyecto"
    },
    dashboard: {
      badge: "Panel de stock",
      title: "Gestión de stock",
      subtitle:
        "Resumen del valor inmovilizado, salidas mensuales y consumo por proyecto.",
      totalValue: "Valor total actual del stock",
      itemCount: "{count} artículo(s) en seguimiento.",
      monthOutputCost: "Coste total de los artículos retirados este mes",
      monthOutputHint: "Basado en las salidas registradas en `stock_movements`.",
      chartTitle: "Valor consumido por proyecto",
      chartSubtitle: "Desglose de salidas mensuales",
      loading: "Cargando panel…",
      empty: "No hay salidas de stock registradas para el mes actual.",
      noProject: "Sin proyecto"
    }
  },
  marketingPricing: {
    page: {
      login: "Iniciar sesión",
      freeTrial: "Prueba gratuita",
      kicker: "No. 01 — Precios transparentes",
      title1: "El plan que se ajusta",
      titleEmphasis: "tu proyecto",
      intro:
        "{days} días para probarlo todo — sin tarjeta de crédito. Luego, sigue gratis para 2 personas o actualiza a Starter / Pro a medida que crezca tu equipo.",
      compareTitle: "Comparación",
      compareTitleEmphasis: "de un vistazo",
      compareSubtitle: "Qué cambia entre Gratuito, Starter y Pro.",
      footnote: "* En el plan Gratuito, elige cualquiera de los 5 módulos de entre los 11 disponibles.",
      ctaTitle: "Facturación mensual, cancelación",
      ctaTitleEmphasis: "en cualquier momento",
      ctaTitleRest: ".",
      ctaBody: "El plan Gratuito sigue disponible sin límite de tiempo para 1–2 personas.",
      ctaButton: "Empezar — {days} días gratis",
    },
    freeSubtitle: "1 a 2 personas, módulos esenciales",
    starterSubtitle: "Hasta 10 personas, todos los módulos",
    popular: "✦ MÁS POPULAR",
    proSubtitle: "Equipos ilimitados + asistente de IA",
    seeDetails: "Ver detalles de precios",
    comparisonFeature: "Funcionalidad",
    planFree: "Gratuito",
    planStarter: "Inicial",
    planPro: "Profesional",
    rows: {
      users: "Usuarios",
      modules: "Módulos activables",
      dashboard: "Panel y tareas",
      workload: "Carga del equipo",
      planning: "Planificación y buzón de ideas",
      asks: "Bandeja de solicitudes",
      eventsSocial: "Eventos y redes sociales",
      filesStock: "Archivos, inventario y objetivos",
      surveys: "Encuestas de satisfacción",
      ai: "Asistente de IA",
      integrations: "Outlook y Slack / Teams",
      branding: "Personalización (logo y colores)",
      support: "Soporte"
    },
    cells: {
      usersFree: "1 a 2",
      usersStarter: "2 a 5",
      usersPro: "5 a 25",
      modulesFree: "5 máx.",
      modulesAll: "11 (todos)",
      choice: "Tu elección*",
      supportFree: "Comunidad",
      supportStarter: "Correo 48 h",
      supportPro: "Prioritario"
    }
  },
  outlook: {
    loading: "Cargando estado de la conexión…",
    proRequired: "La sincronización de Outlook está incluida en el plan Pro.",
    seeOffers: "Ver ofertas",
    notConfigured:
      "La integración de Microsoft 365 aún no está configurada en el servidor. Configura MS_CLIENT_ID, MS_CLIENT_SECRET y MS_TENANT_ID",
    envLocal: "en .env.local.",
    envVercel:
      "en las variables de entorno de Vercel (Producción), y luego vuelve a desplegar. También añade el URI de redirección",
    envAzure: "en Azure (App registration → Autenticación).",
    connected: "Outlook conectado",
    accountFallback: "Cuenta de Microsoft 365",
    category: "categoría",
    inOutlook: "(naranja) en Outlook.",
    sync: "Sincronizar",
    refresh: "Actualizar",
    disconnect: "Desconectar",
    connectDescription:
      "Conecta tu cuenta de Microsoft 365 para que cada día o franja horaria programada en una tarea se agregue automáticamente a tu calendario de Outlook.",
    connect: "Conectar Outlook",
    toast: {
      syncError: "No se pudo sincronizar el calendario de Outlook.",
      notConnected: "Outlook no está conectado.",
      partialSync: "{synced} tareas OK, {errors} fallaron. Motivo: {cause}",
      unknownCause: "desconocido",
      noTasks:
        "No hay tareas programadas asignadas a ti ({scanned} tarea(s) examinada(s)). Comprueba que eres el propietario y que se ha configurado una franja horaria.",
      synced: "{count} tarea(s) sincronizada(s) con Outlook.",
      connected: "Calendario de Outlook conectado.",
      scheduledSent: "{count} tarea(s) programada(s) enviada(s) a Outlook.",
      msNotConfigured: "Microsoft 365 no está configurado en el servidor (variables MS_*).",
      oauthFailed: "La comprobación de seguridad OAuth falló; inténtalo de nuevo.",
      connectFailed: "Falló la conexión con Outlook.",
      disconnected: "Calendario de Outlook desconectado.",
      disconnectError: "No se pudo desconectar Outlook."
    }
  },
  platform: {
    loadError: "No se pudo cargar",
    kicker: "Administración de la plataforma",
    title: "Organizaciones",
    subtitle: "Vista de soporte: estado de facturación, planes y número de miembros.",
    refresh: "Actualizar",
    colOrganization: "Organización",
    colPlan: "Plan",
    colBilling: "Facturación",
    colMembers: "Miembros",
    colTrialEnd: "Fin de la prueba",
    empty: "No hay organizaciones.",
    restricted: "Acceso restringido mediante `PLATFORM_ADMIN_EMAILS`.",
  },
  billingGate: {
    proFeature: "Funcionalidad Pro",
    paidFeature: "Funcionalidad de pago",
    proOnly: "está disponible con el plan Pro.",
    starterPro: "está disponible con los planes Starter y Pro (a partir de 2 colaboradores).",
    seeOffers: "Ver ofertas →",
    trialExpiredTitle: "Tu prueba gratuita ha finalizado",
    trialExpiredBody:
      "Puedes continuar en el plan Gratuito (1 a 2 usuarios) o elegir una suscripción para desbloquear más funciones.",
    subscriptionInactiveTitle: "Suscripción inactiva",
    subscriptionInactiveBody:
      "Tu suscripción está suspendida o cancelada. Reactívala para seguir usando la aplicación.",
    accessSuspendedTitle: "Acceso suspendido",
    accessSuspendedBody: "Es necesaria una suscripción activa para usar este espacio de trabajo.",
    billing: "Facturación",
    signOut: "Cerrar sesión",
    trialExpiredBadge: "Prueba caducada",
    choosePlan: "Elegir una suscripción",
    dataKept:
      "Tus datos se conservan. El acceso se restablece en cuanto haya una suscripción activa.",
    features: {
      ai: "Asistente de IA (reescritura, resúmenes)",
      outlook_sync: "Sincronización de Outlook / Microsoft 365",
      slack_alerts: "Alertas de stock de Slack / Teams",
      advanced_modules:
        "Módulos avanzados (eventos, social, archivos y visuales, inventario, objetivos, encuestas)",
      team_workload: "Vista de carga del equipo (desglose por colaborador)"
    }
  },
  legal: {
    cookie: {
      ariaLabel: "Consentimiento de cookies",
      title: "Cookies y privacidad",
      body: "Usamos cookies estrictamente necesarias para el servicio (sesión, preferencias) y, con tu consentimiento, cookies de medición de audiencia. Consulta nuestra",
      privacyLink: "política de privacidad",
      essentialOnly: "Solo esenciales",
      acceptAll: "Aceptar todas",
      close: "Cerrar"
    },
    footer: {
      legal: "Aviso legal",
      privacy: "Política de privacidad",
      terms: "Términos del servicio",
      pricing: "Precios",
      gdpr:
        "De acuerdo con el GDPR, tus datos personales se procesan según nuestra política de privacidad. Tienes derecho a acceder, rectificar y eliminar tus datos."
    },
    document: {
      privacy: "Privacidad",
      terms: "Términos",
      legal: "Aviso legal",
      lastUpdated: "Última actualización:"
    }
  },
  notifications: {
    taskFallback: "Tarea",
    newTask: "Nueva tarea",
    concernsYou: "« {name} » te concierne.",
    addedToProject: "Añadido al proyecto",
    nowFollowing: "Ahora sigues « {name} ».",
    newDeadline: "Nueva fecha límite: {date}",
    deadlineRemoved: "Fecha límite eliminada",
    taskMoved: "Tarea movida",
    movedTo: "« {name} » se mueve a {column}",
    realtimeTitle: "Notificaciones en tiempo real",
    realtimeDisconnected:
      "Interrupción de la conexión: {detail}. Comprueba la replicación de Realtime en la tabla « tasks » (Supabase).",
    realtimeUnavailable:
      "No se pueden recibir alertas Kanban en vivo. Activa Realtime para « tasks » y revisa las políticas RLS.",
    overdue: "Fecha límite vencida",
    overdueBody: "« {name} » vencía el {date}.",
    dueToday: "Vence hoy",
    dueTodayBody: "« {name} » por vencer.",
    dueTomorrow: "Vence mañana",
    dueTomorrowBody: "« {name} » por vencer mañana ({date}).",
    bell: {
      ariaLabel: "Centro de notificaciones",
      title: "Notificaciones",
      clearAll: "Borrar todo",
      emptyTitle: "Aún no hay notificaciones",
      emptyBody:
        "Aquí verás las nuevas tareas que te conciernen, cambios de fecha límite o columna (en tiempo real) y recordatorios. Si un compañero modifica el Kanban, también aparecerá una alerta arriba a la derecha.",
      open: "Abrir",
      srOnly: "Notificaciones",
    },
  },
  datePicker: {
    today: "Hoy",
    clear: "Borrar",
    selectDate: "Elegir una fecha",
    prevMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
  },
  calendarView: {
    closeMenu: "Cerrar menú",
    color: "Color",
    untitled: "Sin título",
    columnSync: "Columna « {label} » — sincronizada con el Kanban",
    prevPeriod: "Periodo anterior",
    nextPeriod: "Periodo siguiente",
    today: "Hoy",
    addEvent: "Evento",
    views: {
      month: "Mes",
      week: "Semana",
      day: "Día",
      agenda: "Agenda",
    },
    modal: {
      kicker: "Calendario",
      editTitle: "Editar evento",
      newTitle: "Nuevo evento",
      close: "Cerrar",
      titleLabel: "Título",
      titlePlaceholder: "Reunión, punto de equipo…",
      locationLabel: "Lugar",
      locationPlaceholder: "Sala A, videollamada, Slack…",
      allDay: "Todo el día",
      start: "Inicio",
      end: "Fin",
      date: "Fecha",
      notes: "Notas",
      notesPlaceholder: "Orden del día, enlace…",
      hubHint: "Los nuevos eventos creados aquí se añaden al hub de eventos.",
      delete: "Eliminar",
      cancel: "Cancelar",
      save: "Guardar",
    },
    toast: {
      eventAdded: "Evento añadido al hub de eventos",
      columnNotFound: "Columna no encontrada para esta tarea.",
      colorUpdated: "Color de « {label} » actualizado",
      colorError: "No se pudo cambiar el color.",
    },
    status: {
      preparation: "En preparación",
    },
    fallback: {
      event: "Evento",
    },
  },
  newTaskModal: {
    firstProjectTitle: "Tu primer proyecto",
    editTitle: "Editar tarea",
    newTitle: "Nueva tarea",
    close: "Cerrar",
    steps: {
      info: "Info",
      estimate: "Estimación",
      planning: "Planificación",
      details: "Detalles",
    },
    tutorialHints: {
      step0: "Paso 1 de 4 — Info: nombra el proyecto y asigna un responsable (*), luego Continuar.",
      step1: "Paso 2 de 4 — Estimación: indica la carga de trabajo estimada, luego Continuar para planificarla.",
      step2: "Paso 3 de 4 — Planificación: coloca la carga en el calendario y añade subtareas si hace falta.",
      step3: "Paso 4 de 4 — Detalles: completa la descripción y crea tu primer proyecto.",
    },
    stepHint: "Paso {step} de 4. Pulsa Intro para continuar.",
    projectName: "Nombre del proyecto",
    projectNameHint: "Nombre mostrado en el Kanban y el calendario. Sé claro y breve.",
    projectNamePlaceholder: "p. ej. Lanzamiento de producto primavera",
    domain: "Dominio",
    domainHint: "Categoría del proyecto (p. ej. digital, print). Filtra las vistas del panel.",
    addDomain: "Añadir un dominio",
    domainPlaceholder: "Nombre del dominio",
    priority: "Prioridad",
    assignees: "Responsable(s)",
    assigneesHint: "Personas a cargo del proyecto. Aparecen en filtros y carga de trabajo.",
    assigneesLegend: "Responsables",
    loadingProfile: "Cargando tu perfil…",
    autoAssignedHint: "Estás asignado automáticamente. Añade compañeros en Ajustes → Administración.",
    deadline: "Fecha límite",
    optional: "(opcional)",
    deadlineHint: "Fecha objetivo de entrega. Visible en el calendario global.",
    budget: "Presupuesto",
    budgetHint: "Presupuesto indicativo del proyecto (opcional). Útil para seguimiento e informes.",
    budgetPlaceholder: "p. ej. 5.000 €",
    estimatedWorkload: "Carga de trabajo estimada",
    workloadHint: "Volumen total a realizar. En el siguiente paso colocarás esta carga en el calendario (p. ej. 3 horas repartidas en varios días).",
    hours: "Horas",
    days: "Días",
    hoursPlaceholder: "p. ej. 3,5 horas",
    daysPlaceholder: "p. ej. 2 días",
    hoursVolumeHint: "Indica el volumen en horas (p. ej. 3). Luego lo colocarás en el calendario.",
    daysVolumeHint: "Indica el volumen en días laborables (1 día ≈ 7 horas para la planificación).",
    planningRemaining: "Por colocar:",
    planningFree: "Planificación libre",
    planningCalendarHint:
      "Arrastra tu bloque en la semana, redimensiónalo desde los bordes o selecciona un hueco vacío. Los bloques grises ya están planificados en otro sitio.",
    subtasks: "To-do / Subtareas",
    subtasksHint: "Divide el proyecto en pasos con fecha límite y responsable. Se crearán automáticamente.",
    removeSubtask: "Quitar este paso",
    subtaskNamePlaceholder: "Nombre de la to-do (Intro para añadir)",
    subtaskDeadlineTitle: "Fecha límite de la to-do",
    description: "Descripción del proyecto",
    descriptionHint: "Contexto, objetivos, restricciones — todo lo que ayude al equipo a empezar.",
    descriptionPlaceholder: "Notas, objetivos, canales, restricciones, etc.",
    cancel: "Cancelar",
    back: "Volver",
    continue: "Continuar",
    save: "Guardar",
    createFirstProject: "Crear mi primer proyecto ✨",
    createTask: "Crear tarea",
    successFirstTitle: "¡Primer proyecto creado!",
    successTitle: "¡Tarea creada!",
    successFirstBody: "Tu tarjeta aparece en el Kanban. Gran primer paso.",
    successBody: "La tarea está en el tablero. Sigue así.",
    domainAdded: "Dominio añadido.",
    untitled: "Sin título",
  },
  confirmDialog: {
    cancel: "Cancelar",
    confirm: "Confirmar",
    delete: "Eliminar",
    close: "Cerrar",
    providerError: "useConfirm debe usarse dentro de <ConfirmDialogProvider>."
  }
} as const;
