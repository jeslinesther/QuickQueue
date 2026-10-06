import csv
import random
import numpy as np

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)

services = {
    'General Consultation': 5.0,
    'Account Services': 7.0,
    'Technical Support': 10.0,
    'Billing & Payments': 4.0
}

rows = []
header = [
    'queue_length',
    'active_counters',
    'service_type',
    'average_service_time',
    'hour',
    'day_of_week',
    'peak_hour',
    'waiting_time_minutes'
]

for _ in range(1200):
    service_type = random.choice(list(services.keys()))
    base_service_time = services[service_type]
    
    # Add minor fluctuation to service time
    avg_service_time = round(base_service_time + random.uniform(-1.0, 1.5), 1)
    queue_len = random.randint(1, 35)
    counters = random.randint(1, 5)
    hour = random.randint(9, 18)
    day = random.randint(0, 6)
    
    # Peak hour: 11-14 (lunch) and 17-19 (evening rush)
    is_peak = 1 if ((11 <= hour <= 14) or (17 <= hour <= 19)) else 0
    
    # Waiting time formula with congestion multiplier and minor realistic noise
    congestion = 1.25 if is_peak == 1 else 1.0
    day_factor = 1.1 if day in [0, 4] else 1.0 # Mondays and Fridays slightly busier
    
    noise = random.gauss(0, 1.5)
    raw_wait_time = ((queue_len * avg_service_time) / counters) * congestion * day_factor + noise
    wait_time = max(1.0, round(raw_wait_time, 1))
    
    rows.append([
        queue_len,
        counters,
        service_type,
        avg_service_time,
        hour,
        day,
        is_peak,
        wait_time
    ])

with open('c:/Users/sjesl/Downloads/mernstack/ai/dataset.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    writer.writerows(rows)

print(f"Generated {len(rows)} realistic training samples in dataset.csv")
