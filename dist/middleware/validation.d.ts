import { Request, Response, NextFunction } from 'express';
export declare const sanitizeString: (value: string) => string;
export declare const sanitizeEmail: (value: string) => string;
export declare const sanitizeObjectId: (value: string) => string;
export declare const validateUser: import("express-validator").ValidationChain[];
export declare const validateUserLogin: import("express-validator").ValidationChain[];
export declare const validateConsultation: import("express-validator").ValidationChain[];
export declare const validateProject: import("express-validator").ValidationChain[];
export declare const validateCourse: import("express-validator").ValidationChain[];
export declare const validateDraft: import("express-validator").ValidationChain[];
export declare const validatePlan: import("express-validator").ValidationChain[];
export declare const validateObjectId: import("express-validator").ValidationChain[];
export declare const validatePagination: import("express-validator").ValidationChain[];
export declare const validateSearch: import("express-validator").ValidationChain[];
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map