// Hook para carregar dinamicamente componentes remotos utilizando Module Federation.
/* Exemplo de uso
const RemoteComponent = useRemoteComponent({
  url: 'url_remote',
  scope: 'remoteName',
  module: 'module', // ./app
  props: { prop1:'a' },
});

*/

import { useState, useEffect, ComponentType, ReactNode } from 'react';

import { FullScreenLoading } from 'components/FullScreenLoading';
import { verbose } from 'utils/verbose';

import RemoteAppErrorFallback from './ErrorFallback';

interface UseRemoteComponentProps {
  url: string | undefined;
  scope: string;
  module: string;
  props?: any;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
}

function loadRemoteScript(url: string | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    if (url) {
      // Verifica se o script já foi carregado
      if (document.querySelector(`script[src="${url}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Erro ao carregar o script ${url}`));
      document.head.appendChild(script);
    } else reject(new Error('Url inválida'));
  });
}

async function loadRemoteComponent(
  url: string | undefined,
  scope: string,
  module: string,
): Promise<{ default: ComponentType<any> }> {
  await loadRemoteScript(url);

  const container = (window as any)[scope];

  if (!container) {
    throw new Error('Container remoto não encontrado');
  }

  // Verifica se ja foi inicializado
  if (!container.initialized) {
    /* eslint-disable-next-line */
    await container.init((__webpack_share_scopes__ as any).default);
    container.initialized = true;
  }

  const factory = await container.get(module);
  return factory();
}

export function useRemoteComponent({
  url,
  scope,
  module,
  props = {},
  loadingComponent = <FullScreenLoading />,
  errorComponent = <RemoteAppErrorFallback />,
}: UseRemoteComponentProps) {
  const [Component, setComponent] = useState<ComponentType<any> | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        const { default: LoadedComponent } = await loadRemoteComponent(url, scope, module);
        setComponent(() => LoadedComponent);
      } catch (error) {
        verbose.error('Erro ao carregar o componente remoto:', error);
        setHasError(true);
      }
    };

    loadComponent();
  }, [url, scope, module]);

  if (hasError) {
    return errorComponent;
  }

  if (!Component) {
    return loadingComponent;
  }

  return <Component {...props} />;
}
