export const CURRICULUM = [
  {
    area: 'Fundamentos',
    color: '#2d5a27',
    icon: '🧠',
    items: [
      { id: 'c01', title: 'Neurociencias básicas', source: 'Kaplan Cap. 1–3', priority: 'esencial', focus: 'Vías dopaminérgicas, eje HPA, neurotransmisores y su correlato clínico.' },
      { id: 'c02', title: 'Teorías de la personalidad', source: 'Kaplan Cap. 4', priority: 'esencial', focus: 'Mecanismos de defensa, etapas del desarrollo, psicología del self.' },
      { id: 'c03', title: 'Evaluación y diagnóstico', source: 'Kaplan Cap. 5–6', priority: 'esencial', focus: 'EEM completo, uso de escalas (PANSS, HDRS, YMRS), DSM-5 vs CIE-11.' },
    ]
  },
  {
    area: 'Psicopatología Mayor',
    color: '#3d7a35',
    icon: '🔬',
    items: [
      { id: 'c04', title: 'Espectro esquizofrénico', source: 'Kaplan Cap. 7', priority: 'esencial', focus: 'Hipótesis dopaminérgica y glutamatérgica, síntomas de Schneider, catatonía.' },
      { id: 'c05', title: 'Trastornos del ánimo', source: 'Kaplan Cap. 8', priority: 'esencial', focus: 'Diagnóstico diferencial TB I/II/ciclotimia, especificadores, riesgo suicida.' },
      { id: 'c06', title: 'Trastornos de ansiedad y TOC', source: 'Kaplan Cap. 9–10', priority: 'esencial', focus: 'Modelos cognitivos, YBOCS, diagnóstico diferencial fobia/TAG/pánico.' },
      { id: 'c07', title: 'Trauma y disociación', source: 'Kaplan Cap. 11–12', priority: 'importante', focus: 'Criterios TEPT/TEA, modelo de trauma-disociación, TID.' },
    ]
  },
  {
    area: 'Clínica Especializada',
    color: '#5a9e50',
    icon: '🏥',
    items: [
      { id: 'c08', title: 'Trastornos de personalidad', source: 'Kaplan Cap. 22', priority: 'esencial', focus: 'Clusters A/B/C, TPB y DBT, modelo alternativo DSM-5.' },
      { id: 'c09', title: 'Trastornos neurocognitivos', source: 'Kaplan Cap. 21', priority: 'esencial', focus: 'Delirium vs demencia, DCL, sensibilidad neuroléptica, IACE.' },
      { id: 'c10', title: 'Sustancias y adicciones', source: 'Kaplan Cap. 20', priority: 'esencial', focus: 'Abstinencia alcohólica, MAT en opioides, TUS DSM-5.' },
      { id: 'c11', title: 'Urgencias psiquiátricas', source: 'Kaplan Cap. 23', priority: 'esencial', focus: 'Agitación, síndrome serotoninérgico vs NMS, evaluación suicida.' },
      { id: 'c12', title: 'Psiquiatría infanto-juvenil', source: 'Kaplan Cap. 31', priority: 'importante', focus: 'TDAH, TEA (ADOS-2, ADI-R), trastornos del ánimo en infancia.' },
    ]
  },
  {
    area: 'Tratamientos',
    color: '#2d5a27',
    icon: '💊',
    items: [
      { id: 'c13', title: 'Psicofarmacología', source: 'Kaplan Cap. 29', priority: 'esencial', focus: 'Perfil receptor de antipsicóticos, ISRS/ISRN, estabilizadores, TEC.' },
      { id: 'c14', title: 'Psicoterapias', source: 'Kaplan Cap. 28', priority: 'importante', focus: 'TCC, DBT, psicodinámica breve, mentalización — evidencia y mecanismos.' },
    ]
  },
  {
    area: 'Lecturas Complementarias',
    color: '#3d7a35',
    icon: '📚',
    items: [
      { id: 'c15', title: 'DSM-5-TR', source: 'APA 2022', priority: 'esencial', focus: 'Criterios diagnósticos actualizados. Leer en paralelo con Kaplan.' },
      { id: 'c16', title: 'Guías APSA', source: 'APSA Argentina', priority: 'importante', focus: 'Guías de práctica clínica locales: depresión, esquizofrenia, TEA.' },
      { id: 'c17', title: 'Stahl\'s Essential Psychopharmacology', source: 'Stahl 5ª ed.', priority: 'recomendado', focus: 'Farmacología visual. Excelente para mecanismos de acción.' },
      { id: 'c18', title: 'The Maudsley Prescribing Guidelines', source: 'Taylor et al.', priority: 'recomendado', focus: 'Referencia de prescripción. Consultar antes de casos complejos.' },
      { id: 'c19', title: 'Psicoanálisis y psiquiatría', source: 'Liberman', priority: 'recomendado', focus: 'Contexto psicodinámico local. Importante para la formación argentina.' },
    ]
  },
]

export const PRIORITY_LABEL = { esencial: 'Esencial', importante: 'Importante', recomendado: 'Recomendado' }
export const PRIORITY_COLOR = { esencial: '#2d5a27', importante: '#3d7a35', recomendado: '#5a9e50' }

export const MENTOR_ROLES = [
  { id: 'socratico',    label: 'Prof. Marcos — Socrático',         desc: 'Guía con preguntas, no da respuestas directas' },
  { id: 'farmacologo',  label: 'Experto en Farmacología',          desc: 'Profundiza mecanismos, interacciones y evidencia' },
  { id: 'supervisor',   label: 'Supervisor Clínico',               desc: 'Razona casos, toma de decisiones terapéuticas' },
  { id: 'investigador', label: 'Tutor de Investigación',           desc: 'Metodología, estadística, lectura crítica de papers' },
  { id: 'psicodinámico',label: 'Supervisor Psicodinámico',         desc: 'Transferencia, contratransferencia, dinámica de casos' },
  { id: 'examinador',   label: 'Examinador MIR/Residencia',        desc: 'Preguntas tipo examen, casos con trampa, presión' },
]
