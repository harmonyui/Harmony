import type { NextFont } from "next/dist/compiled/@next/font";
import {
  Inter,
  Roboto,
  Open_Sans as OpenSans,
  Alegreya,
  Montserrat,
  Lato,
  Poppins,
  Mulish,
  Corben,
  Nobile,
} from "next/font/google";
import local from "next/font/local";

export interface Font {
  id: string;
  name: string;
  font: NextFont;
}

export const inter = Inter({
  subsets: ["latin"],
});
export const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
});

export const openSans = OpenSans({
  subsets: ["latin"],
});

export const alegreya = Alegreya({
  subsets: ["latin"],
});

export const montserrat = Montserrat({
  subsets: ["latin"],
});

export const lato = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
});

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const mulish = Mulish({
  subsets: ["latin"],
});

export const corben = Corben({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const nobile = Nobile({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const cooper = local({
  src: "./fonts/CooperLightBT.ttf",
});

export const fonts: Font[] = [
  {
    id: inter.className,
    name: "Inter",
    font: inter,
  },
  {
    id: roboto.className,
    name: "Roboto",
    font: roboto,
  },
  {
    id: openSans.className,
    name: "Open Sans",
    font: openSans,
  },
  {
    id: alegreya.className,
    name: "Alegreya",
    font: alegreya,
  },
  {
    id: montserrat.className,
    name: "Montserrat",
    font: montserrat,
  },
  {
    id: lato.className,
    name: "Lato",
    font: lato,
  },
  {
    id: poppins.className,
    name: "Poppins",
    font: poppins,
  },
  {
    id: mulish.className,
    name: "Mulish",
    font: mulish,
  },
  {
    id: cooper.className,
    name: "Cooper",
    font: cooper,
  },
];
