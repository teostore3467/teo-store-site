export type ServiceFulfillmentType =
  | 'account_credentials'
  | 'activation_code'
  | 'activation_link'
  | 'activation_code_or_link'
  | 'automatic_chat'
  | 'customer_email'
  | 'player_id_verification'
  | 'coming_soon'

export type ServiceAvailabilityStatus =
  | 'available'
  | 'out_of_stock'
  | 'coming_soon'

export type OrderFulfillmentStatus =
  | 'waiting_payment'
  | 'payment_review'
  | 'payment_confirmed'
  | 'waiting_customer'
  | 'waiting_admin'
  | 'waiting_customer_confirmation'
  | 'processing'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export type CustomerFieldType =
  | 'email'
  | 'text'
  | 'player_id'
  | 'checkbox'

export type CustomerField = {
  id: string
  label: string
  type: CustomerFieldType
  placeholder?: string
  required: boolean
  helpText?: string
}

export type DeliveryFieldType =
  | 'email'
  | 'password'
  | 'note'
  | 'code'
  | 'link'
  | 'username'

export type DeliveryField = {
  id: string
  label: string
  type: DeliveryFieldType
  sensitive?: boolean
}

export type ServiceFulfillmentConfig = {
  type: ServiceFulfillmentType
  availability: ServiceAvailabilityStatus
  customerFields: CustomerField[]
  deliveryFields: DeliveryField[]
  requiresPaymentBeforeFulfillment: boolean
  opensChatAfterPayment: boolean
  requiresCustomerConfirmation: boolean
  adminCanCloseChat: boolean
  warning?: string
  instructions?: string
}