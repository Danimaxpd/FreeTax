import React, { useState } from 'react';
import {
  Alert,
  AlertIcon,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { createYearConfigFromBase, registerTaxYearConfig } from '../../constants/tax-values';
import { parseCurrencyInput } from '../../helpers/number';
import { TaxYearConfig } from '../../types/tax.types';

interface YearConfigModalProps {
  currentYear: number;
  currentConfig: TaxYearConfig;
  onClose: () => void;
  onRegistered: (year: number) => void;
}

function parseStrictInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseStrictDecimal(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export const YearConfigModal: React.FC<YearConfigModalProps> = ({
  currentYear,
  currentConfig,
  onClose,
  onRegistered,
}) => {
  const [yearInput, setYearInput] = useState(String(currentYear + 1));
  const [uvtInput, setUvtInput] = useState(String(Math.round(currentConfig.uvt * 1.05)));
  const [smmlvInput, setSmmlvInput] = useState(
    String(Math.round(currentConfig.minimumWage * 1.06)),
  );
  const [healthPctInput, setHealthPctInput] = useState(
    String(Number((currentConfig.contributions.health.rate * 100).toFixed(2))),
  );
  const [pensionPctInput, setPensionPctInput] = useState(
    String(Number((currentConfig.contributions.pension.rate * 100).toFixed(2))),
  );
  const [ibcPctInput, setIbcPctInput] = useState(
    String(Number((currentConfig.contributions.health.base * 100).toFixed(2))),
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);

    const parsedYear = parseStrictInt(yearInput);
    if (parsedYear === null || parsedYear < 2020 || parsedYear > 2100) {
      setErrorMsg('Ingrese un año fiscal válido entre 2020 y 2100.');
      return;
    }

    const uvtParsed = parseCurrencyInput(uvtInput, { allowZero: false, min: 1000 });
    if (uvtParsed.value === null) {
      setErrorMsg(`UVT inválido: ${uvtParsed.error ?? 'ingrese un valor positivo.'}`);
      return;
    }

    const smmlvParsed = parseCurrencyInput(smmlvInput, { allowZero: false, min: 100000 });
    if (smmlvParsed.value === null) {
      setErrorMsg(`SMMLV inválido: ${smmlvParsed.error ?? 'ingrese un valor positivo.'}`);
      return;
    }

    const healthPct = parseStrictDecimal(healthPctInput);
    if (healthPct === null || healthPct <= 0 || healthPct > 100) {
      setErrorMsg('El porcentaje de Salud debe estar entre 0.1% y 100%.');
      return;
    }

    const pensionPct = parseStrictDecimal(pensionPctInput);
    if (pensionPct === null || pensionPct <= 0 || pensionPct > 100) {
      setErrorMsg('El porcentaje de Pensión debe estar entre 0.1% y 100%.');
      return;
    }

    const ibcPct = parseStrictDecimal(ibcPctInput);
    if (ibcPct === null || ibcPct <= 0 || ibcPct > 100) {
      setErrorMsg('La base de cotización (IBC %) debe estar entre 1% y 100%.');
      return;
    }

    let normativeRef = 'Configuración personalizada en memoria';
    if (parsedYear === currentYear) {
      normativeRef = currentConfig.normativeRef
        ? `${currentConfig.normativeRef} · Personalizado en memoria`
        : 'Personalizado en memoria';
    }

    const config = createYearConfigFromBase({
      year: parsedYear,
      uvt: uvtParsed.value,
      minimumWage: smmlvParsed.value,
      healthRate: healthPct / 100,
      pensionRate: pensionPct / 100,
      ibcBase: ibcPct / 100,
      presumptiveCosts: currentConfig.deductions.presumptiveCosts,
      lawLabel: currentConfig.lawLabel,
      normativeRef,
    });

    registerTaxYearConfig(parsedYear, config);
    onRegistered(parsedYear);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
      <ModalContent
        bg="bg.surface"
        color="text.primary"
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="xl"
        mx={4}
      >
        <ModalHeader fontSize="md" fontWeight="bold" color="text.heading" pb={2}>
          Agregar o Personalizar Año Fiscal en Memoria
        </ModalHeader>
        <ModalCloseButton aria-label="Cerrar" color="text.secondary" />

        <form onSubmit={handleSubmit}>
          <ModalBody pt={0}>
            <Text fontSize="xs" color="text.secondary" mb={4}>
              Registre parámetros para un nuevo año (ej. 2027) o sobrescriba un año existente en
              esta sesión sin modificar archivos del código.
            </Text>

            {errorMsg && (
              <Alert
                status="error"
                variant="subtle"
                bg="bg.dangerSoft"
                borderWidth="1px"
                borderColor="accent.danger"
                borderRadius="md"
                mb={4}
                fontSize="xs"
              >
                <AlertIcon color="accent.danger" />
                <Text color="accent.danger">{errorMsg}</Text>
              </Alert>
            )}

            <VStack spacing={3} align="stretch">
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel
                    htmlFor="custom-year"
                    fontSize="xs"
                    fontWeight="semibold"
                    color="text.primary"
                    mb={1}
                  >
                    Año Fiscal
                  </FormLabel>
                  <Input
                    id="custom-year"
                    size="sm"
                    type="number"
                    min={2020}
                    max={2100}
                    value={yearInput}
                    onChange={(e) => setYearInput(e.target.value)}
                    bg="bg.input"
                    color="text.primary"
                    borderColor="border.strong"
                    _hover={{ borderColor: 'border.accent' }}
                    _focusVisible={{ borderColor: 'accent.primary', boxShadow: 'none' }}
                    borderRadius="md"
                  />
                </FormControl>

                <FormControl>
                  <Flex justify="space-between" align="baseline" mb={1}>
                    <FormLabel
                      htmlFor="custom-ibc"
                      fontSize="xs"
                      fontWeight="semibold"
                      color="text.primary"
                      mb={0}
                    >
                      Base IBC (%)
                    </FormLabel>
                    <Text fontSize="xs" color="text.muted">
                      Estándar: 40%
                    </Text>
                  </Flex>
                  <Input
                    id="custom-ibc"
                    size="sm"
                    type="text"
                    value={ibcPctInput}
                    onChange={(e) => setIbcPctInput(e.target.value)}
                    bg="bg.input"
                    color="text.primary"
                    borderColor="border.strong"
                    _hover={{ borderColor: 'border.accent' }}
                    _focusVisible={{ borderColor: 'accent.primary', boxShadow: 'none' }}
                    borderRadius="md"
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel
                    htmlFor="custom-uvt"
                    fontSize="xs"
                    fontWeight="semibold"
                    color="text.primary"
                    mb={1}
                  >
                    Valor UVT (COP)
                  </FormLabel>
                  <Input
                    id="custom-uvt"
                    size="sm"
                    type="text"
                    value={uvtInput}
                    onChange={(e) => setUvtInput(e.target.value)}
                    bg="bg.input"
                    color="text.primary"
                    borderColor="border.strong"
                    _hover={{ borderColor: 'border.accent' }}
                    _focusVisible={{ borderColor: 'accent.primary', boxShadow: 'none' }}
                    borderRadius="md"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel
                    htmlFor="custom-smmlv"
                    fontSize="xs"
                    fontWeight="semibold"
                    color="text.primary"
                    mb={1}
                  >
                    SMMLV (COP)
                  </FormLabel>
                  <Input
                    id="custom-smmlv"
                    size="sm"
                    type="text"
                    value={smmlvInput}
                    onChange={(e) => setSmmlvInput(e.target.value)}
                    bg="bg.input"
                    color="text.primary"
                    borderColor="border.strong"
                    _hover={{ borderColor: 'border.accent' }}
                    _focusVisible={{ borderColor: 'accent.primary', boxShadow: 'none' }}
                    borderRadius="md"
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                <FormControl>
                  <Flex justify="space-between" align="baseline" mb={1}>
                    <FormLabel
                      htmlFor="custom-health"
                      fontSize="xs"
                      fontWeight="semibold"
                      color="text.primary"
                      mb={0}
                    >
                      Tasa Salud (%)
                    </FormLabel>
                    <Text fontSize="xs" color="text.muted">
                      Estándar: 12.5%
                    </Text>
                  </Flex>
                  <Input
                    id="custom-health"
                    size="sm"
                    type="text"
                    value={healthPctInput}
                    onChange={(e) => setHealthPctInput(e.target.value)}
                    bg="bg.input"
                    color="text.primary"
                    borderColor="border.strong"
                    _hover={{ borderColor: 'border.accent' }}
                    _focusVisible={{ borderColor: 'accent.primary', boxShadow: 'none' }}
                    borderRadius="md"
                  />
                </FormControl>

                <FormControl>
                  <Flex justify="space-between" align="baseline" mb={1}>
                    <FormLabel
                      htmlFor="custom-pension"
                      fontSize="xs"
                      fontWeight="semibold"
                      color="text.primary"
                      mb={0}
                    >
                      Tasa Pensión (%)
                    </FormLabel>
                    <Text fontSize="xs" color="text.muted">
                      Estándar: 16%
                    </Text>
                  </Flex>
                  <Input
                    id="custom-pension"
                    size="sm"
                    type="text"
                    value={pensionPctInput}
                    onChange={(e) => setPensionPctInput(e.target.value)}
                    bg="bg.input"
                    color="text.primary"
                    borderColor="border.strong"
                    _hover={{ borderColor: 'border.accent' }}
                    _focusVisible={{ borderColor: 'accent.primary', boxShadow: 'none' }}
                    borderRadius="md"
                  />
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>

          <ModalFooter gap={2}>
            <Button
              type="button"
              size="sm"
              variant="outline"
              bg="bg.subtle"
              color="text.primary"
              borderColor="border.subtle"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              bg="accent.primary"
              color="#ffffff"
              _hover={{ opacity: 0.9 }}
            >
              Guardar Año en Memoria
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
