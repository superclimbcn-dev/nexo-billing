// data-display
export { ClientAvatar } from './data-display/client-avatar'
export type { ClientAvatarProps } from './data-display/client-avatar'
export { InvoiceRow } from './data-display/invoice-row'
export type { InvoiceRowProps, StatusType } from './data-display/invoice-row'
export { KpiCard } from './data-display/kpi-card'
export type { KpiCardProps, KpiDeltaVariant } from './data-display/kpi-card'
export { Panel } from './data-display/panel'
export type { PanelProps } from './data-display/panel'
export { StatusChip } from './data-display/status-chip'
export type { StatusChipProps } from './data-display/status-chip'
export { VerifactuChip } from './data-display/verifactu-chip'
export type { VerifactuChipProps } from './data-display/verifactu-chip'

// invoice
export { InvoicePdfPreview } from './invoice/invoice-pdf-preview'
export type {
  InvoicePdfPreviewProps,
  PdfParty,
  PdfLineItem,
  PdfTotals,
} from './invoice/invoice-pdf-preview'
export { InvoiceTotals } from './invoice/invoice-totals'
export type { InvoiceTotalsProps } from './invoice/invoice-totals'
export { LineItemRow } from './invoice/line-item-row'
export type { LineItemRowProps } from './invoice/line-item-row'
export { LineItemsTable } from './invoice/line-items-table'
export type { LineItemsTableProps } from './invoice/line-items-table'

// layout
export { AppShell } from './layout/app-shell'
export type { AppShellProps } from './layout/app-shell'
export { ComplianceBadge } from './layout/compliance-badge'
export type { ComplianceBadgeProps } from './layout/compliance-badge'
export { NavItem } from './layout/nav-item'
export type { NavItemProps } from './layout/nav-item'
export { NavSectionLabel } from './layout/nav-section-label'
export type { NavSectionLabelProps } from './layout/nav-section-label'
export { Sidebar } from './layout/sidebar'
export type { SidebarProps } from './layout/sidebar'
export { TenantSelector } from './layout/tenant-selector'
export type { TenantSelectorProps } from './layout/tenant-selector'
export { TopBar, ScreenSwitcher } from './layout/top-bar'
export type { TopBarProps, ScreenSwitcherProps, ScreenItem } from './layout/top-bar'

// marketing
export { WhatsappPromoCard } from './marketing/whatsapp-promo-card'
export type { WhatsappPromoCardProps } from './marketing/whatsapp-promo-card'

// mobile
export { PhoneActionCard } from './mobile/phone-action-card'
export type { PhoneActionCardProps } from './mobile/phone-action-card'
export { PhoneFrame } from './mobile/phone-frame'
export type { PhoneFrameProps } from './mobile/phone-frame'
export { PhoneServiceItem } from './mobile/phone-service-item'
export type { PhoneServiceItemProps, ServiceStatus } from './mobile/phone-service-item'

// onboarding
export { ProgressDots } from './onboarding/progress-dots'
export type { ProgressDotsProps, DotState } from './onboarding/progress-dots'
export { VerticalCard } from './onboarding/vertical-card'
export type { VerticalCardProps } from './onboarding/vertical-card'

// primitives
export { Button } from './primitives/button'
export type { ButtonProps, ButtonVariant } from './primitives/button'
export { cn } from './primitives/cn'
export { FormInput } from './primitives/form-input'
export type { FormInputProps } from './primitives/form-input'

// tokens
export { colors } from './tokens/colors'
export type { ColorKey } from './tokens/colors'
export { typography } from './tokens/typography'
