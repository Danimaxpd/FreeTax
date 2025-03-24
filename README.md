# Colombian Tax Calculator

## Description

This project is a Colombian Tax Calculator designed to calculate the monthly tax for a "persona independiente" (independent worker) based on their monthly income. The calculator takes into account health and pension contributions, presumptive costs, and applies the appropriate tax brackets to determine the tax amount.

## Features

- Dynamic tax calculations based on yearly configurations
- Calculate monthly and annual income
- Calculate health and pension contributions based on configurable rates (currently 12.5% and 16% respectively)
- Calculate taxable income with presumptive costs (currently 25%)
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

To use the Colombian Tax Calculator:

```bash
npm run dev
```

### Example Usage

```bash
npm run dev
```

### Example Output

```bash
Ingrese su salario mensual (COP): 5000000
[2025-03-23 23:03:01.809 -0500] INFO: Calculadora de Impuestos Colombia 2025
[2025-03-23 23:03:01.810 -0500] INFO: =====================================
[2025-03-23 23:03:05.372 -0500] INFO:
=== REPORTE DE IMPUESTOS 2025 ===
[2025-03-23 23:03:05.372 -0500] INFO:
--- Aportes ---
[2025-03-23 23:03:05.412 -0500] INFO: Salud (12.5%): $250.000 COP
[2025-03-23 23:03:05.412 -0500] INFO: Pensión (16%): $320.000 COP
[2025-03-23 23:03:05.413 -0500] INFO: Total: $570.000 COP
[2025-03-23 23:03:05.413 -0500] INFO: --- DETALLES DE CONTRIBUCIONES ---
[2025-03-23 23:03:05.413 -0500] INFO: --- Valores Mensuales ---
[2025-03-23 23:03:05.413 -0500] INFO: Salario Mensual: $5.000.000 COP
[2025-03-23 23:03:05.413 -0500] INFO: Costos Presuntivos Mensuales (25%): $1.250.000 COP
[2025-03-23 23:03:05.413 -0500] INFO: Base Gravable Mensual: $3.180.000 COP
[2025-03-23 23:03:05.413 -0500] INFO: Impuesto Mensual a Pagar: $0 COP
[2025-03-23 23:03:05.413 -0500] INFO:
--- Valores Anuales ---
[2025-03-23 23:03:05.413 -0500] INFO: Ingreso Anual: $60.000.000 COP
[2025-03-23 23:03:05.413 -0500] INFO: Costos Presuntivos Anuales (25%): $15.000.000 COP
[2025-03-23 23:03:05.413 -0500] INFO: Base Gravable Anual: $38.160.000 COP
[2025-03-23 23:03:05.413 -0500] INFO: Impuesto Anual a Pagar: $0 COP
[2025-03-23 23:03:05.413 -0500] INFO: Tasa Efectiva de Impuestos: 0.00%
[2025-03-23 23:03:05.413 -0500] INFO:
--- Resumen ---
[2025-03-23 23:03:05.413 -0500] INFO: Total Deducciones Mensuales: $570.000 COP
[2025-03-23 23:03:05.413 -0500] INFO: Ingreso Neto Mensual: $4.430.000 COP
[2025-03-23 23:03:05.413 -0500] INFO: ================================
```

## How It Works

The calculator performs the following operations:

1. Accepts monthly income in Colombian Peso format (e.g., 16.600.000)
2. Calculates the contribution base (IBC) as 40% of monthly income (with minimum wage floor)
3. Calculates health (12.5%) and pension (16%) contributions based on the IBC
4. Calculates annual income and applies presumptive costs deduction (25%)
5. Determines taxable income by subtracting deductions and contributions
6. Applies progressive tax brackets using UVT values for 2025
7. Calculates monthly tax withholding and effective tax rate
8. Shows total monthly deductions and net income

## Configuration

The calculator supports multiple year configurations. Currently, it includes data for 2025:

- UVT Value: $49,799 COP
- Minimum Wage: $1,300,000 COP
- Health Contribution: 12.5% of 40% of income
- Pension Contribution: 16% of 40% of income
- Presumptive Costs: 25% of income
- Progressive Tax Brackets:
  - 0% up to 1090 UVT
  - 19% from 1090 to 1700 UVT
  - 28% from 1700 to 4100 UVT
  - 33% from 4100 to 8670 UVT
  - 35% from 8670 to 18970 UVT
  - 39% above 18970 UVT

To add configurations for other years, update the `TAX_YEARS` object in `src/constants/tax-values.ts`.

## Invite me a cup of tea ☕

[PayPal](https://paypal.me/danimaxpd?country.x=CO&locale.x=es_XC).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.
