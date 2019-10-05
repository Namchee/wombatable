import { UserService } from './user';
import { ServiceResult } from '../service';
import { AccountRepository } from '../../repository/account';
import { USER_REPLY } from './reply';
import { UserRepository } from '../../repository/user';
import { REPLY } from '../reply';
import { UserAccountRepository } from '../../repository/user-account';
import { UserError, ServerError } from '../../types/error';

export class GantiService extends UserService {
  private readonly userAccountRepository: UserAccountRepository;

  public constructor(
    accountRepository: AccountRepository,
    userRepository: UserRepository,
    userAccountRepository: UserAccountRepository
  ) {
    super(accountRepository, userRepository);
    this.userAccountRepository = userAccountRepository;

    GantiService.handler = [
      this.handleZeroState,
      this.handleFirstState,
      this.handleSecondState,
    ];
  }

  public handle = async (
    id: string,
    state: number,
    text: string,
  ): Promise<ServiceResult> => {
    const exist = await this.accountRepository.exist(id);

    if (!exist) {
      throw new UserError(USER_REPLY.NO_ASSOCIATE);
    }

    const fragments = text.split(' ');

    if (fragments.length > 3) {
      throw new UserError(REPLY.WRONG_FORMAT);
    }

    let result: ServiceResult = {
      state: -1,
      message: '',
    };

    const handlerLength = GantiService.handler.length;
    const fragmentsLength = fragments.length;

    for (let i = state; i < handlerLength && i < fragmentsLength; i++) {
      result = await GantiService.handler[i](id, fragments[i]);
    }

    if (result.state === -1) {
      throw new ServerError(REPLY.ERROR, 500);
    }

    return result;
  }

  private handleZeroState = async (
    id: string,
    text: string,
  ): Promise<ServiceResult> => {
    if (text !== 'ganti') {
      throw new ServerError(REPLY.ERROR, 500);
    }

    return {
      state: 1,
      message: USER_REPLY.INPUT_ASSOCIATE,
    };
  }

  private handleFirstState = async (
    id: string,
    text: string
  ): Promise<ServiceResult> => {
    const userNomor = await this.userAccountRepository.findUserNomor(id);

    if (text !== userNomor) {
      throw new UserError(USER_REPLY.MISMATCHED_NOMOR);
    }

    return {
      state: 2,
      message: USER_REPLY.INPUT_NEW_ASSOCIATE,
    };
  }

  private handleSecondState = async (
    id: string,
    text: string,
  ): Promise<ServiceResult> => {
    const provider = id.split('@')[0];
    const newUser = await this.userRepository.findOne(text);

    if (newUser === null) {
      throw new UserError(USER_REPLY.NOT_REGISTERED);
    }

    const clientAccount = await this.accountRepository.findClientAccount(
      provider,
      newUser
    );

    if (clientAccount) {
      throw new UserError(USER_REPLY.ALREADY_REGISTERED);
    }

    const currentUserAccount = await this.userAccountRepository.findUserNomor(
      id
    );

    // Shouldn't be executed
    if (currentUserAccount === null) {
      throw new ServerError(REPLY.ERROR, 500);
    }

    const oldUser = await this.userRepository.findOne(currentUserAccount);

    // Shouldn't be executed
    if (oldUser === null) {
      throw new ServerError(REPLY.ERROR, 500);
    }

    await this.accountRepository.moveAccount(id, oldUser, newUser);

    return {
      state: 0,
      message: USER_REPLY.CHANGE_SUCCESS,
    };
  }
}
