// O hook useIntervalAsync permite configurar uma função para ser executada repetidamente em intervalos específicos,
// similar ao setInterval, mas com suporte para funções assíncronas (Promise) e síncronas.

import { useEffect, useRef } from 'react';

type UseIntervalAsyncOptions = {
  /**
   * delay: Intervalo em milissegundos entre as execuções.
   */
  delay: number;

  /**
   * waitFirst: Se true, espera o delay antes de executar a primeira vez.
   * Se false ou undefined, executa imediatamente e depois a cada delay.
   */
  waitFirst?: boolean;

  /**
   * isActive: Se true, o intervalo é ativo. Se false, o intervalo não é iniciado.
   * Valor padrão é true.
   */
  isActive?: boolean;
};

const useIntervalAsync = (
  callback: () => Promise<void> | void,
  options: UseIntervalAsyncOptions
) => {
  const { delay, waitFirst, isActive = true } = options;
  const isMounted = useRef(true);
  const savedCallback = useRef(callback);

  // Lembrar da última função de callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = async () => {
      if (isMounted.current) {
        await Promise.resolve(savedCallback.current());
        if (isMounted.current) {
          setTimeout(tick, delay);
        }
      }
    };

    // Se isActive for false, não inicia o intervalo
    if (!isActive) {
      return;
    }

    isMounted.current = true;

    // Controla se deve esperar o delay antes da primeira execução
    if (waitFirst) {
      setTimeout(tick, delay);
    } else {
      tick();
    }

    // Limpeza: evita execução após desmontagem do componente
    return () => {
      isMounted.current = false;
    };
  }, [delay, waitFirst, isActive]);
};

export default useIntervalAsync;
