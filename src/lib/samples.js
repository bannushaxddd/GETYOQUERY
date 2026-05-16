export const DIALECTS = ['PostgreSQL','MySQL','SQLite','SQL Server','BigQuery','Snowflake','Oracle','DuckDB']

export const EXAMPLE_PROMPTS = [
  'Top 10 customers by total order value in the last 30 days',
  'Monthly revenue trend for the past 12 months',
  'Products with low stock (under 10) that have active orders',
  'Customers who ordered 3+ times but not in the last 60 days',
  'Average review rating per product category',
]

export const SAMPLE_SCHEMAS = {
  ecommerce: {
    label: 'E-commerce',
    sql: `CREATE TABLE customers (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  country     VARCHAR(50),
  tier        VARCHAR(20) DEFAULT 'free',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  category    VARCHAR(100),
  price       DECIMAL(10,2) NOT NULL,
  stock_qty   INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE
);
CREATE TABLE orders (
  id           SERIAL PRIMARY KEY,
  customer_id  INT REFERENCES customers(id),
  status       VARCHAR(20) DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  shipped_at   TIMESTAMPTZ
);
CREATE TABLE order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INT REFERENCES orders(id),
  product_id  INT REFERENCES products(id),
  quantity    INT NOT NULL,
  unit_price  DECIMAL(10,2) NOT NULL
);`,
  },
  blog: {
    label: 'Blog / CMS',
    sql: `CREATE TABLE authors (
  id        SERIAL PRIMARY KEY,
  username  VARCHAR(50) UNIQUE NOT NULL,
  email     VARCHAR(255) NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE posts (
  id           SERIAL PRIMARY KEY,
  author_id    INT REFERENCES authors(id),
  title        VARCHAR(300) NOT NULL,
  slug         VARCHAR(300) UNIQUE NOT NULL,
  body         TEXT,
  status       VARCHAR(20) DEFAULT 'draft',
  views        INT DEFAULT 0,
  published_at TIMESTAMPTZ
);
CREATE TABLE comments (
  id         SERIAL PRIMARY KEY,
  post_id    INT REFERENCES posts(id),
  author_id  INT REFERENCES authors(id),
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`,
  },
  hr: {
    label: 'HR System',
    sql: `CREATE TABLE departments (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  budget     DECIMAL(12,2),
  manager_id INT
);
CREATE TABLE employees (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  department_id INT REFERENCES departments(id),
  hire_date     DATE NOT NULL,
  salary        DECIMAL(10,2),
  job_title     VARCHAR(100),
  is_active     BOOLEAN DEFAULT TRUE
);
CREATE TABLE leave_requests (
  id          SERIAL PRIMARY KEY,
  employee_id INT REFERENCES employees(id),
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  type        VARCHAR(30),
  status      VARCHAR(20) DEFAULT 'pending'
);`,
  },
  saas: {
    label: 'SaaS Analytics',
    sql: `CREATE TABLE workspaces (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(200) NOT NULL,
  plan       VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE users (
  id           SERIAL PRIMARY KEY,
  workspace_id INT REFERENCES workspaces(id),
  email        VARCHAR(255) UNIQUE NOT NULL,
  role         VARCHAR(20) DEFAULT 'member',
  last_seen_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE events (
  id           BIGSERIAL PRIMARY KEY,
  workspace_id INT REFERENCES workspaces(id),
  user_id      INT REFERENCES users(id),
  event_name   VARCHAR(100) NOT NULL,
  properties   JSONB,
  occurred_at  TIMESTAMPTZ DEFAULT NOW()
);`,
  },
}
