import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors"

const app = new Elysia();


app.use(cors());
app.use(swagger({
  documentation: {
    info: {
      title: "Webbound API",
      version: "1.0.0",

    },
  },
}));

app.get("/", () => {
  return "Hello World";
});

app.post("/", ({ body }) => {
  return body;
});


app.listen(3000);
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
