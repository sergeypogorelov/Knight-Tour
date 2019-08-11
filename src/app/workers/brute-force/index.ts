import SearchWorker from 'worker-loader!./search';

import { IActionMessage } from "../../common/interfaces/messages/actions/action-message.interface";
import { IStartSearchMessage } from "../../common/interfaces/messages/actions/start-search-message.interface";
import { ISearchErrorMessage } from "../../common/interfaces/messages/notifications/search-error.interface";

import { Actions } from "../../common/enums/actions.enum";
import { Notifications } from "../../common/enums/notifications.enum";

import { Board } from "../../common/entities/board.class";
import { Knight } from "../../common/entities/knight.class";

const ctx: Worker = self as any;

let tag: string;

ctx.addEventListener('message', message => {
    const messageData = message.data as IActionMessage;

    tag = messageData.tag;

    if (messageData.type === Actions.SearchStart) {
        const actionMessage = messageData as IStartSearchMessage;

        const knight = new Knight(Board.createFromJSON(actionMessage.board));

        let depth = 0;
        let maxBoardsFound = 0;

        let boards: Board[] = [];

        do {
            depth++;

            boards = knight.findAllMovesCombinations(depth);

            if (boards.length === maxBoardsFound)
                break;
            
            if (boards.length > maxBoardsFound) {
                maxBoardsFound = boards.length;
            }
        } while(boards.length < actionMessage.maxThreadCount);

        const searchWorker = new SearchWorker();
        searchWorker.addEventListener('message', message => console.log(message));

        const newMessage: IStartSearchMessage = {
            tag: '1',
            type: Actions.SearchStart,
            board: boards[0].asJSON(),
            maxThreadCount: null
        };
        searchWorker.postMessage(newMessage);

        console.log(boards);
    }
});

ctx.addEventListener('error', error => {
    const errorMessage: ISearchErrorMessage = {
        tag: tag,
        type: Notifications.SearchError,
        message: error.message
    };
    
    ctx.postMessage(errorMessage);
});
