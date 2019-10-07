import {
  TemplateType,
  ButtonsTemplate,
  CarouselTemplate,
  ActionButton,
  CarouselItem,
} from './type';
import { Button } from '../type';
import { isButtonArray, isStringArray } from '../type';

export abstract class LineMessage {
  public readonly type: string;

  public constructor(type: string) {
    if (!LineMessage.isValidType(type)) {
      throw new Error('Invalid Type');
    }

    this.type = type;
  }

  /**
   * Memeriksa apakah type messagenya valid atau tidak.
   * Tujuannya adalah mencegah seseorang memasukkan hal gila
   * dan bikin appnya jadi meledak jelas (yup, gw sedang menatap
   * future self).
   *
   * @static
   * @param {string} type Type message
   * @return {boolean} `true` kalau ada di spec LINE API,
   * `false` kalau gak ada.
   * @memberof LineMessage
   */
  public static isValidType(type: string): boolean {
    return type === 'text' ||
      type === 'template' ||
      type === 'image' ||
      type === 'video' ||
      type === 'audio' ||
      type === 'location' ||
      type === 'sticker' ||
      type === 'imagemap' ||
      type === 'flex';
  }
}

export class TextMessage extends LineMessage {
  public readonly text: string;

  public constructor(text: string) {
    super('text');
    this.text = text;
  }
}

abstract class TemplateMessage extends LineMessage {
  public readonly template: TemplateType;

  public constructor(template: TemplateType) {
    super('template');
    this.template = template;
  }
}

export class ButtonsMessage extends TemplateMessage {
  public constructor(template: ButtonsTemplate) {
    super(template);
  }
}

export class CarouselMessage extends TemplateMessage {
  public constructor(template: CarouselTemplate) {
    super(template);
  }
}

export function generateActionButton(
  label: string,
  text: string
): ActionButton {
  return {
    type: 'message',
    label,
    text,
  };
}

export function generateCarouselItem(
  text: string,
): CarouselItem {
  return {
    text,
  };
}

export function generateButtonsTemplate(
  buttons: ActionButton[]
): ButtonsTemplate {
  return {
    type: 'buttons',
    actions: buttons,
  };
}

export function generateCarouselTemplate(
  items: CarouselItem[]
): CarouselTemplate {
  return {
    type: 'carousel',
    columns: items,
  };
}

export function generateLineMessage(
  message: string | string[] | Button[]
): any {
  if (typeof message === 'string') {
    return new TextMessage(message);
  } else if (isStringArray(message)) {
    const carouselItems: CarouselItem[] = [];

    for (const item of message) {
      carouselItems.push(generateCarouselItem(item));
    }

    const carouselTemplate: CarouselTemplate = generateCarouselTemplate(
      carouselItems
    );

    return new CarouselMessage(carouselTemplate);
  } else if (isButtonArray(message)) {
    const actionButtons: ActionButton[] = [];

    for (const button of message) {
      actionButtons.push(generateActionButton(button.label, button.text));
    }

    const buttonsTemplate: ButtonsTemplate = generateButtonsTemplate(
      actionButtons
    );

    return new ButtonsMessage(buttonsTemplate);
  } else {
    throw new Error('Unsupported types');
  }
}