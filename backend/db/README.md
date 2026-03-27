# Sequelize MSSQL Data Layer

## Overview
This directory contains the MSSQL Sequelize database layer for BacheLORE.

## Files
- `database.js` - Sequelize connection and bootstrapping
- `models.js` - All relational model definitions, indexes, and associations

## Conventions
- UUID primary keys for all tables
- PascalCase column names
- FK naming with explicit relation semantics
- `ON DELETE CASCADE` for workflow dependents
- `ON DELETE SET NULL` for optional parent ownership relationships
