type Counters = { [key: string]: number };

const counters: Counters = {
  webhook_received: 0,
  webhook_enqueued: 0,
  webhook_processed_success: 0,
  webhook_processed_failure: 0,
  webhook_retry_attempts: 0,
  webhook_deadletter_count: 0,
  revenue_total: 0,
};

export function incCounter(name: keyof Counters, value = 1) {
  if (!counters[name]) counters[name] = 0;
  counters[name] += value;
}

export function getCounter(name: keyof Counters) {
  return counters[name] || 0;
}

export function addRevenue(amount: number) {
  counters.revenue_total += amount;
}

export function getMetrics() {
  return { ...counters };
}
