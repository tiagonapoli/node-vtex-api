import { IOClients } from '../../../../../clients/IOClients';
import { ParamsContext, RecorderState, ServiceContext } from '../../typings';
export declare function error<T extends IOClients, U extends RecorderState, V extends ParamsContext>(ctx: ServiceContext<T, U, V>, next: () => Promise<void>): Promise<void>;
