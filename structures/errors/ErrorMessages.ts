import { TBErrorCode } from "./ErrorCodes.js";

export default {
	[TBErrorCode.ElevatedPermissionsRequired]: 'This command is limited for developers\' uses only.',

	[TBErrorCode.MissingPermissions]: (target: string, permissions: string) =>
		`${target} do(es) not have sufficient permissions to use this command. Required permissions: ${permissions}`,

	[TBErrorCode.PreconditionsFailed]: (message: string) =>
		message,
	[TBErrorCode.DisallowedLocation]: (type: string, append: string, allowedLocation?: string[]) =>
		`You can not use ${type} ${append}.${allowedLocation?.length ? `\nYou may use ${type} in ${allowedLocation.join(', ')}` : ''}`,

	[TBErrorCode.DisallowedUsage]: (target: string) => `${target} do(es) not have permissions to use this command.`,
	[TBErrorCode.UnknownResource]: (type: string, name: string, location?: string) =>
		`${type} '${name}' does not exist${location ? ` in ${location}` : ''}.`,
	[TBErrorCode.DuplicatedResource]: (type: string, name: string, location?: string) =>
		`${type} '${name}' already existed${location ? ` in ${location}` : ''}.`,

	[TBErrorCode.LimitExceeded]: (type: string, resource: string, limit: string | number) =>
		`The limit for ${type} of ${resource} has been reached (${limit}).`,

	[TBErrorCode.ValidationFailure]: (message: string) => message,
	[TBErrorCode.UserError]: (message: string) => message
};
