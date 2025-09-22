import { app } from "@azure/functions";
app.setup({
    enableHttpStream: true,
});

import "./functions/loginFunction";
import "./functions/productsFunction";
