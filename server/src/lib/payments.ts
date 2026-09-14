/**
 * Payment adapter interface.
 * Cash on Delivery is the only complete method for local demo.
 * Online providers can implement this without changing checkout orchestration.
 */
export type PaymentMethodCode = 'cod';

export interface PaymentChargeInput {
  orderId: string;
  amountMinor: number;
  currency: string;
  method: PaymentMethodCode;
}

export interface PaymentChargeResult {
  status: 'pending' | 'authorized' | 'captured' | 'failed';
  provider: string;
  providerReference?: string;
  message?: string;
}

export interface PaymentAdapter {
  code: PaymentMethodCode;
  charge(input: PaymentChargeInput): Promise<PaymentChargeResult>;
}

export const codAdapter: PaymentAdapter = {
  code: 'cod',
  async charge(input) {
    return {
      status: 'pending',
      provider: 'cod',
      providerReference: `cod_${input.orderId}`,
      message: 'Cash on Delivery — collect payment on delivery. Not recorded as revenue until collected.',
    };
  },
};

const adapters: Record<PaymentMethodCode, PaymentAdapter> = {
  cod: codAdapter,
};

export function getPaymentAdapter(method: PaymentMethodCode): PaymentAdapter {
  const adapter = adapters[method];
  if (!adapter) throw new Error(`Unsupported payment method: ${method}`);
  return adapter;
}
