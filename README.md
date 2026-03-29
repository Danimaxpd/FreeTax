# Colombian Tax Calculator

## Description

This project is a Colombian Tax Calculator designed to calculate the monthly tax for a "persona independiente" (independent worker) based on their monthly income. The calculator takes into account health and pension contributions, presumptive costs, and applies the appropriate tax brackets to determine the tax amount.

## Features

- Dynamic tax calculations based on yearly configurations (2025, 2026)
- Calculate monthly and annual income
- Calculate health and pension contributions based on configurable rates per year
- Calculate taxable income with presumptive costs
- Apply progressive tax brackets using UVT values
- Generate detailed tax reports with monthly deductions
- Format numbers in Colombian peso style (e.g., 15.000.000)

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/colombia-tax-calculator.git
    ```

2. Navigate to the project directory:

    ```bash
    cd colombia-tax-calculator
    ```

3. Install dependencies:

    ```bash
    npm install
    ```

4. Set environments

    ```bash
    LOG_LEVEL=trace #Pino level logs
    ```

## Usage

To run the Colombian Tax Calculator:

```bash
npm start
```

### Example Output

```
Ingrese su salario mensual (COP): 5000000

=== REPORTE DE IMPUESTOS 2026 ===

--- Aportes ---
Salud (12.5%): $250.000 COP
Pensión (16%): $320.000 COP
Total: $570.000 COP
--- DETALLES DE CONTRIBUCIONES ---
--- Valores Mensuales ---
Salario Mensual: $5.000.000 COP
Costos Presuntivos Mensuales (25%): $1.250.000 COP
Base Gravable Mensual: $3.180.000 COP
Impuesto Mensual a Pagar: $0 COP

--- Valores Anuales ---
Ingreso Anual: $60.000.000 COP
Costos Presuntivos Anuales (25%): $15.000.000 COP
Base Gravable Anual: $38.160.000 COP
Impuesto Anual a Pagar: $0 COP
Tasa Efectiva de Impuestos: 0.00%

--- Resumen ---
Total Deducciones Mensuales: $570.000 COP
Ingreso Neto Mensual: $4.430.000 COP
================================
```

## How It Works

The calculator performs the following operations:

1. Accepts monthly income in Colombian Peso format (e.g., 16.600.000)
2. Calculates the contribution base (IBC) as 40% of monthly income (with minimum wage floor)
3. Calculates health and pension contributions based on the IBC
4. Calculates annual income and applies presumptive costs deduction
5. Determines taxable income by subtracting deductions and contributions
6. Applies progressive tax brackets (Art. 241 Estatuto Tributario) using UVT values
7. Calculates monthly tax withholding and effective tax rate
8. Shows total monthly deductions and net income

## Configuration

The calculator supports multiple year configurations. Currently, it includes data for 2025 and 2026:

### 2025

- UVT Value: $49,799 COP (Resolución DIAN)
- Minimum Wage: $1,423,500 COP (Decreto 1572 de 2024)
- Health Contribution: 12.5% of IBC
- Pension Contribution: 16% of IBC
- IBC Base: 40% of monthly income
- Presumptive Costs: 25% of income

### 2026

- UVT Value: $52,374 COP (Resolución DIAN 000238 de 2025)
- Minimum Wage: $1,750,905 COP (Decreto 0159 de 2026)
- Health Contribution: 12.5% of IBC
- Pension Contribution: 16% of IBC
- IBC Base: 40% of monthly income
- Presumptive Costs: 25% of income

### Progressive Tax Brackets (Art. 241 ET)

Both years share the same bracket structure:

- 0% up to 1,090 UVT
- 19% from 1,090 to 1,700 UVT
- 28% from 1,700 to 4,100 UVT
- 33% from 4,100 to 8,670 UVT
- 35% from 8,670 to 18,970 UVT
- 37% from 18,970 to 31,000 UVT
- 39% above 31,000 UVT

To add configurations for other years, update the `TAX_YEARS` object in `src/constants/tax-values.ts`.

## Invite me a cup of tea ☕

[PayPal](https://paypal.me/danimaxpd?country.x=CO&locale.x=es_XC).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.
