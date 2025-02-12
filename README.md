# Colombian Tax Calculator

## Description

This project is a Colombian Tax Calculator designed to calculate the monthly tax for a "persona independiente" (independent worker) based on their monthly income. The calculator takes into account health and pension contributions, presumptive costs, and applies the appropriate tax brackets to determine the tax amount.

## Features

- Calculate monthly and annual income
- Calculate health and pension contributions (12.5% and 16% respectively)
- Calculate taxable income with presumptive costs (25%)
- Apply progressive tax brackets using UVT values
- Generate detailed tax reports with monthly deductions
- Format numbers in Colombian peso style (e.g., 15.000.000)

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/colombia-tax-calculator.git
    ````

2. Navigate to the project directory:

    ```bash
    cd colombia-tax-calculator
    ```

3. Install dependencies:

    ```bash
    npm install
    ````

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
➜ npm run dev
> colombia-tax-calculator@1.0.0 dev
> tsx src/index.ts
Calculadora de Impuestos Colombia 2025
=====================================
Ingrese su salario mensual (COP): 16.600.000
=== RESUMEN DE APORTES Y RETENCIONES MENSUALES ===
┌────────────────────┬────────────────────────────────────────┬────────────────────┐
│ Concepto │ Cálculo │ Valor (COP) │
├────────────────────┼────────────────────────────────────────┼────────────────────┤
│ IBC │ 16.600.000 × 40% │ 6.640.000 │
├────────────────────┼────────────────────────────────────────┼────────────────────┤
│ Salud │ 6.640.000 × 12.5% │ 830.000 │
├────────────────────┼────────────────────────────────────────┼────────────────────┤
│ Pensión │ 6.640.000 × 16% │ 1.062.400 │
├────────────────────┼────────────────────────────────────────┼────────────────────┤
│ Retención en la │ Cálculo por UVT │ 1.461.743,008 │
│ Fuente │ │ │
├────────────────────┼────────────────────────────────────────┼────────────────────┤
│ Total Deducciones │ │ 3.354.143,008 │
└────────────────────┴────────────────────────────────────────┴────────────────────┘
````

The calculator will:
1. Accept monthly income in Colombian Peso format (e.g., 16.600.000)
2. Calculate IBC (Base Contribution Income) as 40% of monthly income
3. Calculate health (12.5%) and pension (16%) contributions
4. Calculate monthly tax withholding using UVT brackets
5. Show total monthly deductions including all contributions and tax

## invite me a cup of tea ☕

[PayPal](https://paypal.me/danimaxpd?country.x=CO&locale.x=es_XC).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.
