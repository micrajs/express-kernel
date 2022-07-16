/// <reference types="@micra/core/service-provider" />
/// <reference types="@micra/core/service-container" />
/// <reference types="@micra/core/router" />

declare global {
  namespace Application {
    interface ExpressKernelConfig {
      /**
       * The port to listen on.
       */
      port: string;
    }

    interface Services {
      request: Request;
      'request-handler': Micra.RequestHandlerManager;
    }

    interface Configurations {
      'server-kernel': ExpressKernelConfig;
    }

    interface EnvironmentVariables {
      PORT: string;
    }
  }

  namespace Micra {
    interface ServiceProvider {
      registerRequest?(container: ServiceContainer): void | Promise<void>;
      bootRequest?(container: ServiceContainer): void | Promise<void>;
    }
  }

  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends Application.EnvironmentVariables {}
  }
}

export {};
