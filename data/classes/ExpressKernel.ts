/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
import type {Server} from 'http';
import createExpressApp, {type Express} from 'express';
import {createNamespace, getNamespace} from 'cls-hooked';
import {HTTPError, isMicraError, WrappedError} from '@micra/error';
import {fetch, Headers, Request, Response} from '../polyfill/fetch';
import {createFetchRequest} from '../utilities/createFetchRequest';
import {sendFetchResponse} from '../utilities/sendFetchResponse';
import type {Response as NodeResponse} from '../polyfill/fetch';

export class ExpressKernel implements Micra.Kernel<Server> {
  private express: Express = createExpressApp();

  constructor() {
    // Fetch polyfill
    if (!globalThis.fetch) {
      const self = globalThis as any;
      self.fetch = fetch;
      self.Headers = Headers;
      self.Request = Request;
      self.Response = Response;
    }

    createNamespace('request');

    this.onConstruct(this.express);
  }

  onConstruct(_express: Express): void {
    return;
  }

  async boot(application: Micra.Application): Promise<void> {
    if ((globalThis as any).use) {
      (globalThis as any).use = <K extends keyof Application.Services>(
        namespace: K,
      ): Application.Services[K] => {
        const requestScope = getNamespace('request');

        return requestScope?.active
          ? requestScope.get('use')(namespace)
          : application.container.use(namespace);
      };
    }

    this.express.all('*', (req, res, next) => {
      const scope = getNamespace('request');

      if (!scope) {
        throw new HTTPError(
          500,
          `Undefined "Request" namespace. Please make sure the cls-hooked namespace was created in the environment initialization:\n\nrequire('cls-hooked').createNamespace('request');\n`,
        );
      }

      return scope.runPromise(async () => {
        try {
          const request = createFetchRequest(req);
          const container = application.container.clone();
          const requestHandler = application.container.use('request-handler');

          container.value('request', request);

          for (const provider of application.serviceProviders) {
            if (provider.registerRequest) {
              await provider.registerRequest(container);
            }
          }

          for (const provider of application.serviceProviders) {
            if (provider.bootRequest) {
              await provider.bootRequest(container);
            }
          }

          scope.set('use', (namespace: keyof Application.Services) => {
            try {
              return container.use(namespace);
            } catch (e) {
              return application.container.use(namespace);
            }
          });

          await sendFetchResponse(
            res,
            (await requestHandler(container)) as NodeResponse,
          );
        } catch (err) {
          next(
            isMicraError(err)
              ? err
              : err instanceof Error
              ? new WrappedError(err)
              : new HTTPError(500, String(err)),
          );
        }
      });
    });
  }

  async listen(
    application: Micra.Application,
    express: Express,
  ): Promise<Server> {
    const kernelConfig = application.configuration.get('server-kernel');
    return express.listen(kernelConfig!.port);
  }

  async run(application: Micra.Application): Promise<Server> {
    return this.listen(application, this.express);
  }
}
