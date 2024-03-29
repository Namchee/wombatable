import { Service, SmartService } from './base';
import { ServerError, UserError } from '../types/error';
import { REPLY } from './reply';
import { RESPOND } from '../resolver/response';

export class ServiceFactory {
  private readonly serviceList: Service[];
  private readonly smartServiceList: SmartService[];

  private readonly vocabulary: Map<string, number>;

  public constructor(serviceList: Service[]) {
    this.serviceList = serviceList;
    this.smartServiceList = [];
    this.vocabulary = new Map();

    serviceList.forEach((service: Service) => {
      if (service instanceof SmartService) {
        this.smartServiceList.push(service);

        service.keywords.forEach((word: string) => {
          this.vocabulary.set(word, (this.vocabulary.get(word)) || 0 + 1);
        });
      }
    });
  }

  public createService = (
    text: string
  ): Service => {
    for (const service of this.serviceList) {
      if (!(service instanceof SmartService)) {
        if (text.split(' ')[0] === service.identifier) {
          return service;
        }
      }
    }

    return this.createSmartService(text);
  }

  public createServiceByName = (
    name: string
  ): Service => {
    for (const service of this.serviceList) {
      if (service.identifier === name) {
        return service;
      }
    }

    throw new ServerError(REPLY.ERROR, 500);
  }

  private createSmartService = (
    text: string
  ): SmartService => {
    const serviceScore: Map<SmartService, number> = new Map();

    this.smartServiceList.forEach((smartService) => {
      smartService.keywords.forEach((word) => {
        const pattern = new RegExp('\\b' + word + '\\b', 'gi');

        if (pattern.test(text)) {
          const wordFrequency = this.vocabulary.get(word) || 1;
          const termWeight = Math.log2(
            this.smartServiceList.length / wordFrequency
          );

          serviceScore.set(
            smartService,
            (serviceScore.get(smartService) || 0) + termWeight,
          );
        }
      });
    });

    let selectedService = this.smartServiceList[0];
    let currentScore = serviceScore.get(selectedService);

    serviceScore.forEach((value, key) => {
      if (!currentScore || value > currentScore) {
        selectedService = key;
        currentScore = value;
      }
    });

    if (
      !serviceScore.get(selectedService) ||
      serviceScore.get(selectedService) === 0
    ) {
      throw new UserError(RESPOND.UNPARSEABLE);
    }

    return selectedService;
  }
}
