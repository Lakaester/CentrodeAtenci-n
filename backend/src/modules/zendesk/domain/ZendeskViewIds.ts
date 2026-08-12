/** @deprecated Este módulo ha sido reemplazado por modules/zendesk-test/. Se eliminará en M2. */
// Zendesk Views â€” ya no se usan como fuente de datos para la bandeja.
// Se mantienen como referencia para consultas administrativas.
// La bandeja ahora usa GET /tickets.json?status=new,open,pending,solved,closed

export const ZENDESK_VIEW_UNRESOLVED = 360199057454;
export const ZENDESK_VIEW_RECENT_SOLVED = 360199057434;
export const ZENDESK_VIEW_UNASSIGNED = 360199057474;
export const ZENDESK_VIEW_PENDING_REPLY = 360199057514;
export const ZENDESK_VIEW_RECENTLY_UPDATED = 360199057494;

