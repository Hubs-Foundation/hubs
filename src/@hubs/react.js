import _IfFeature from "../react-components/if-feature";
import { Page as _Page } from "../react-components/layout/Page";
import { Header as _Header } from "../react-components/layout/Header";
import { Footer as _Footer } from "../react-components/layout/Footer";
import _PageStyles from "../react-components/layout/Page.scss";
import { useStoreStateChange as _useStoreStateChange } from "../react-components/store/useStoreStateChange";
import { useFavoriteRooms as _useFavoriteRooms } from "../react-components/sdk/useFavoriteRooms";
import { usePublicRooms as _usePublicRooms } from "../react-components/sdk/usePublicRooms";

const react = {
  IfFeature: _IfFeature,
  Page: _Page,
  Header: _Header,
  Footer: _Footer,
  PageStyles: _PageStyles,
  useStoreStateChange: _useStoreStateChange,
  useFavoriteRooms: _useFavoriteRooms,
  usePublicRooms: _usePublicRooms
};

if (window.Hubs) {
  window.Hubs.react = react;
} else {
  window.Hubs = { react };
}

export const IfFeature = _IfFeature;
export const Page = _Page;
export const Header = _Header;
export const Footer = _Footer;
export const PageStyles = _PageStyles;
export const useStoreStateChange = _useStoreStateChange;
export const useFavoriteRooms = _useFavoriteRooms;
export const usePublicRooms = _usePublicRooms;
