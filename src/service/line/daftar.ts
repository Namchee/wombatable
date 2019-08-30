import { LineResponse, LineService } from './../service';
import { UserRepository } from '../../repository/user';
import { LineMessage, TextMessage } from './messages/factory';
import { UserService } from '../base/user';
import { OpcodeError } from '../../types/error';

export class LineDaftarService extends UserService implements LineService {
  public constructor(repository: UserRepository) {
    super(repository);
  }

  private formatMessage(contents: string): LineMessage {
    return new TextMessage(contents);
  }

  public async handle(
    id: string,
    state: number,
    text: string,
  ): Promise<LineResponse> {
    if (await this.checkUserExistence(`line@${id}`)) {
      throw new Error(
        `Akun ini sudah terdaftar dengan sebuah NPM
        
        Apabila anda ingin mengganti NPM, gunakan perintah \`ganti\`
        Apabila anda ingin mengahpus akun, gunakan perintah \`hapus\`.`
      );
    }

    switch (state) {
      case 1: {
        return this.handleFirstState(text, id);
      }
      default: {
        return this.handleFromStart(text, id);
      }
    }
  }

  private async handleFromStart(
    text: string,
    id: string
  ): Promise<LineResponse> {
    const fragments = text.split(' ');

    if (fragments[0] !== 'daftar') {
      throw new Error('Holy cow! This shouldn\'t happen');
    }

    if (fragments.length === 1) {
      const message = this.formatMessage(
        'Mohon masukkan NPM anda untuk diasosiasikan dengan akun LINE ini'
      );

      return {
        state: 1,
        message,
      };
    }

    if (fragments.length === 2) {
      if (!this.isValidNPM(fragments[1])) {
        throw new Error(
          'NPM yang anda masukkan salah, mohon masukkan NPM yang benar'
        );
      }
      await this.userRepository.create(`line@${id}`, text);

      const message = this.formatMessage(
        `Akun berhasil dibuat untuk NPM \`${text}\``
      );

      return {
        state: 0,
        message,
      };
    } else {
      throw new OpcodeError(text);
    }
  }

  private async handleFirstState(
    text: string,
    id: string
  ): Promise<LineResponse> {
    if (!this.isValidNPM(text)) {
      throw new Error(
        'NPM yang anda masukkan salah, mohon masukkan NPM yang benar'
      );
    }

    await this.userRepository.create(`line@${id}`, text);

    const message = this.formatMessage(
      `Akun berhasil dibuat untuk NPM \`${text}\``
    );

    return {
      state: 0,
      message,
    };
  }
}
