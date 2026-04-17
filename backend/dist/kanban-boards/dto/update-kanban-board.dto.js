"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateKanbanBoardDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_kanban_board_dto_1 = require("./create-kanban-board.dto");
class UpdateKanbanBoardDto extends (0, mapped_types_1.PartialType)(create_kanban_board_dto_1.CreateKanbanBoardDto) {
}
exports.UpdateKanbanBoardDto = UpdateKanbanBoardDto;
//# sourceMappingURL=update-kanban-board.dto.js.map