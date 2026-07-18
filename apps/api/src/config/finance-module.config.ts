import { ConfigModule, ConfigService } from "@nestjs/config";
import { Configkey } from "../shared/config-keys";
import { USER_MODULE } from "./user-module.config";
import { FinanceModule } from "../modules/finance/finance.module";

export const FINANCE_MODULE = FinanceModule.forRootAsync({
    imports: [ConfigModule, USER_MODULE],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
        defaultDonationAmount: config.get<number>(Configkey.PROP_DONATION_AMOUNT) ?? 240,
    }),
});
