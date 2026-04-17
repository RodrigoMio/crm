"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLandingPageDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_landing_page_dto_1 = require("./create-landing-page.dto");
class UpdateLandingPageDto extends (0, mapped_types_1.PartialType)(create_landing_page_dto_1.CreateLandingPageDto) {
}
exports.UpdateLandingPageDto = UpdateLandingPageDto;
//# sourceMappingURL=update-landing-page.dto.js.map