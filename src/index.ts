import swagger from "@elysiajs/swagger";
import { Elysia,env, t } from "elysia";
import { cors } from "@elysiajs/cors"
import sql from './config/database';
import { authController } from "./controllers/auth.controller";
import { initOTPModel } from "./models/otp.model";
import { initCompanyModel } from "./models/company.model";
import { companyController } from "./controllers/company.controller";
import fs from 'fs';
const logRequest = (body: any) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    body,
  };
  fs.appendFileSync('request.log', JSON.stringify(logEntry) + '\n');
};

initOTPModel();
initCompanyModel();
// Test database connection
const app = new Elysia()
  .use(cors())
  .use(swagger({
    path: "/docs",
    
    scalarConfig: {
      favicon: "https://i.imgur.com/OI08cbf.jpeg",
      
    },
    documentation: {

      info: {
        title: "Webbound API",
        version: "1.0.0",
        
      },
      components: {

        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-key',
          },
          ApiSecretAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-secret',
          },
        }
      }
    }
  }))
  .get("/ping", () => {
    // Test database connection
    sql`SELECT 1`;

    return {
      status: 200,
      isSuccess: true,
      message: "Pong",
      data: {
        database: "Connected",
      }
    };
  }, {
    detail: {
      summary: "Ping API",
      description: "Check if API is running",
     
    },
    response: {
      200: t.Object({
        status: t.Number({ examples: [ 200 ] }),
        isSuccess: t.Boolean({ examples: [ true ] }),
        message: t.String({ examples: [ "Pong" ] }),
        data: t.Object({
          database: t.String({ examples: [ "Connected" ] }),
        }),
      }),
    },
    tags: [ "Test API" ],
  })
  .post('/webhook', (ctx) => {
    logRequest(ctx.body); // Log the request body and timestamp
    console.log(ctx.body);
    // Store req.body in log file
    
    return ctx.body;
  })
  
  .use(authController)
  .use(companyController)
  .onError(({ code,error, path, redirect }) => {
    if (path === "/") {
      return redirect('/docs')
    }
    return {
      status: code,
      isSuccess: false,
      message: error,
      data: null,
    };
  })
  .listen(process.env.PORT ?? 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
