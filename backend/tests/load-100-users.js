import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '60s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<100'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  const health = http.get(`${BASE_URL}/health`);
  check(health, {
    'health status is 200': (r) => r.status === 200,
  });

  const announcements = http.get(`${BASE_URL}/api/announcements?page=1&limit=10`);
  check(announcements, {
    'announcements status is 200': (r) => r.status === 200,
  });

  const marketplace = http.get(`${BASE_URL}/api/marketplace`);
  check(marketplace, {
    'marketplace status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
