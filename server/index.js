const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/products',     require('./routes/products'));
app.use('/api/categories',   require('./routes/categories'));
app.use('/api/suppliers',    require('./routes/suppliers'));
app.use('/api/warehouses',   require('./routes/warehouses'));
app.use('/api/orders',       require('./routes/orders'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/reorders',       require('./routes/reorders'));
app.use('/api/reports',        require('./routes/reports'));
app.use('/api/billing',        require('./routes/billing'));
app.use('/api/notifications',  require('./routes/notifications'));

app.listen(process.env.PORT || 3001, () =>
  console.log(`Server running on port ${process.env.PORT || 3001}`)
);
