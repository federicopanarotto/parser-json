import { Formatter } from "./formatter.ts";
import { lex } from "./lexer.ts";
import { Parser } from "./parser.ts";
import { formatXml, XmlParser } from "./xmlParser.ts";
import { YamlParser } from "./yamlPerser.ts";

const obj = {
  userName: "John",
  age: 30,
  pc: {
    motherboard: "NZXT z690",
    case: "NZXT H7",
    cpu: "Intel i5-13600kf",
    ram: "4x8 Corsair Vengeance 3600",
    psu: "Corsair RM 750x",
    cooler: "NZXT Kraken 420mm",
    gpu: "Gigabyte Aourus 3060 Ti",
    fans: {
      top: ["flow", "flow", "flow"],
      back: ["flow"],
      front: ["flow", "flow", "flow"],
    }
  },
}
// lex('{"name": "John", "age": 30, "pc": {"motherboard": "nzxt z690", "cpu": "i5 13600kf"}}');
const tokens = lex(JSON.stringify(obj));

for (const token of tokens) {
  console.log(JSON.stringify(token));
}

const ats = new Parser(tokens);
const result = ats.parse();

const xmlAts = new XmlParser(tokens);
const xmlResult = xmlAts.parse();

const yamlAts = new YamlParser(tokens);
const yamlResult = yamlAts.parse();

console.log(JSON.stringify(result, null, 2));
console.log(formatXml(xmlResult));
console.log(yamlAts.valueToYaml(yamlResult, 2));

const formatter = new Formatter({
  indent: 2,
  pretty: true,
  casing: 'snake',
  includeNull: false
});

console.log(formatter.format(result));