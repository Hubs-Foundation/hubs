import React, { useEffect, useState, useContext } from "react";
import ReactDOM from "react-dom";
import registerTelemetry from "../../telemetry";
import "../../utils/theme";
import "../../react-components/styles/global.scss";
import "../../assets/larchiveum/style.scss";
import "../../assets/larchiveum/loading.scss";
import moment from "moment-timezone";
import Store from "../../utilities/store";
import ExhibitionsService from "../../utilities/apiServices/ExhibitionsService";
import ReserveService from "../../utilities/apiServices/ReserveService";
import Popup from "../../react-components/popup/popup";
import Pagination from "../../react-components/pagination/pagination";
import { APP_ROOT } from "../../utilities/constants";
import defaultImage from "../../assets/larchiveum/siri.gif";
import Moment from "react-moment";
import "reactjs-popup/dist/index.css";
import UserService from "../../utilities/apiServices/UserService";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Language from './languages/language';
import { useTranslation } from 'react-i18next';
import logo from "./../../assets/images/larchiveum_logo.png";
// ICON
import {
  MdPublic,
  MdPeopleAlt,
  MdCalendarToday,
  MdOutlineCheckCircleOutline,
} from "react-icons/md";


registerTelemetry("/home", "Hubs Home Page");

export function HomePage() {
  return <Home />;
}

function Home() {
  toast.configure();
  const [exhibitionsLoaded, setExhibitionsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isActiveSortASC, setIsActiveSortASC] = useState(true);
  const [isActiveSortDESC, setIsActiveSortDESC] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpenNotification, setIsOpenNotification] = useState(false);
  const [currentExhibitionId, setCurrentExhibitionId] = useState(null);
  const [exhibitions, setExhibitions] = useState({
    data: [],
    pagination: {}
  });
  const [exhibitionNoti, setExhibitionNoti] = useState(undefined);
  const [filterExhibitionList, setfilterExhibitionList] = useState({
    page: 1,
    pageSize: 9,
    sort: "startDate|desc", //format <attribute>|<order type>,
  });
  const [language, setLanguage] = useState('en');

  const user = Store.getUser();
  const { t } = useTranslation();
 
  useEffect(
    () => {

      auth();
      // redirect to verify page
      const qs = new URLSearchParams(location.search);
      if (qs.has("auth_topic")) {
        const redirectUrl = new URL("/verify", window.location);
        redirectUrl.search = location.search;
        window.location = redirectUrl;
      }
      getAllExhibitions();

      let lang = Language.getLanguage();
      //Language.setLanguage(lang);
      setLanguage(lang);
    },
    [filterExhibitionList.page, filterExhibitionList.sort]
  );

  function auth() {
    const token = Store.getUser()?.token;
    UserService.checkToken(token)
      .then(res => {
        if (res.result == "ok") {
          const user = Store.getUser();
          if (res.data.id != user?.id) {
            Store.removeUser();
          }
        } else {
          Store.removeUser();
        }
        setIsLoading(false);
      })
      .catch(error => {
        setIsLoading(false);
      });
  }

  const togglePopup = exhibitionId => {
    setIsOpen(!isOpen);
    setCurrentExhibitionId(exhibitionId);
  };

  const getAllExhibitions = () => {
    const user = Store.getUser();
    const data = filterExhibitionList;
    if (user) {
      ExhibitionsService.getAllWithAuthExhibitions(data).then(res => {
        if (res.result == "ok") {
          setExhibitions(res.data);
          console.log(res.data);
          setExhibitionsLoaded(true);
        } else if (res.result == "fail" && res.error == "get_exhibitions_fail") {
          toast.error("Get Exhibitions fail !", { autoClose: 1000 });
        }
      });
    } else {
      ExhibitionsService.getAllExhibitions(data).then(res => {
        if (res.result == "ok") {
          setExhibitions(res.data);
          setExhibitionsLoaded(true);
        } else if (res.result == "fail" && res.error == "get_exhibitions_fail") {
          toast.error("Get Exhibitions fail !", { autoClose: 1000 });
        }
      });
    }
  };

  const handleSignOut = () => {
    Store.removeUser();
    window.location.reload();
  };

  const handleButtonVisit = event => {
    let user = Store.getUser();
    let url = APP_ROOT;
    var roomId = event.currentTarget.getAttribute("data-roomid");
    if (roomId && roomId != "") {
      if (APP_ROOT === "https://larchiveum.link") {
        url += "/" + roomId;
      } else {
        url += "/hub.html?hub_id=" + roomId;
      }
    }

    url = new URL(url);

    if(user?.displayName){
      url.searchParams.set('displayName', user.displayName);
    }

    if(user?.avatar){
      url.searchParams.set('avatarId', user.avatar.url);
    }
    else
    if(user?.avatarId){
      url.searchParams.set('avatarId', user.avatarId);
    }

    window.open(url.href,'_blank');
  };

  const openPopupReservation = event => {
    var exhibitionId = event.currentTarget.getAttribute("data-id-exhibition");
    togglePopup(exhibitionId);
  };

  const handleReservate = () => {
    console.log(currentExhibitionId);
    const exhibitionId = currentExhibitionId;
    ReserveService.createReservations(exhibitionId).then(res => {
      if (res.result == "ok") {
        exhibitions.data.forEach(exhibition => {
          if (exhibition.id == exhibitionId) {
            exhibition.reservated = true;
            exhibition.reservationCount = exhibition.reservationCount + 1;
            toast.success("Successful reservation!", { autoClose: 1000 });
          }
        });
        setIsOpen(!isOpen);
      } else if (res.result == "fail") {
        toast.error("Error reservation!", { autoClose: 1000 });
      }
    });
  };

  const handleButtonLogin = (event) => {
    window.location.href = '/?page=signin';
  };

  const handleChangeLanguage = (event) => {
    let lang = event.target.value;
    setLanguage(lang);
    Language.setLanguage(lang);
  };

  const changePages = page => {
    setfilterExhibitionList({
      ...filterExhibitionList,
      page
    });
  };

  const sortNewest = () => {
    setfilterExhibitionList({
      sort: "startDate|desc"
    });
    setIsActiveSortASC(true);
    setIsActiveSortDESC(false);
  };

  const sortOldest = () => {
    setfilterExhibitionList({
      sort: "startDate|asc"
    });
    setIsActiveSortASC(false);
    setIsActiveSortDESC(true);
  };

  const renderExhibitions = () => {
    return (
      <>
        {exhibitionsLoaded ? (
          <>
            {exhibitions.data.map((item, index) => {
              let user = Store.getUser();
              let today = new Date();
              let startDate = item.startDate ? new Date(item.startDate) : null;
              let endDate = item.endDate ? new Date(item.endDate) : null;

              let ActionButton = ()=>{

                if(startDate && startDate > today && (item.public || item.reservated)){
                  return (
                    <button 
                      key={'will-open-on'}
                      className="signin-up btn-visit nt-time-yet"
                      onClick={() => { openPopupNotification(item) }}
                      data-id-exhibition={item.id}
                    >
                      {t('home.WILL_OPEN_ON')} {moment(item.startDate).format('MMMM DD')}
                    </button>
                  )
                }

                if(user && !item.reservated && !item.public && item.reservationCount < item.maxSize){
                  return (
                    <button
                      key={'reservation'}
                      className="signin-up btn-visit reserved"
                      onClick={openPopupReservation}
                      data-id-exhibition={item.id}
                    >
                      {t('home.MAKE_RESERVATION')}
                    </button>
                  );
                }

                if(!startDate || (startDate <= today && (item.public || item.reservated))){
                  return (
                    <button
                      key={'enter'}
                      className="signin-up btn-visit"
                      onClick={handleButtonVisit}
                      data-roomid={item.roomId}
                    >
                      {t('home.ENTER')}
                    </button>
                  );
                }

                if(user && !item.reservated && item.reservationCount >= item.maxSize ){
                  return (
                    <button
                      key={'exhibition-full'}
                      className="signin-up btn-visit full"
                    >
                      {t('home.EXHIBITION_FULL')}
                    </button>
                  );
                }

                if(!user && !item.public){
                  return (
                    <button
                      key={'signin'}
                      className="signin-up btn-visit signin"
                      onClick={handleButtonLogin}
                    >
                      {t('home.SIGN_IN')}
                    </button>
                  );
                }

                return <></>
              };

              let StatusIcon = ()=>{
                if(item.public){
                  return (
                    <div className="span3">
                      <MdPublic size={37} color="#FFF" />
                    </div>
                  )
                }
                else
                if(item.reservated){
                  return ( 
                    <div className="span3">
                    <MdOutlineCheckCircleOutline size={37} color="#FFF" />
                  </div>
                  )
                }
                else{
                  return <></>
                }
              }
              
              return <>
                <div key={index} className={"items"}>
                  <img src={item?.room?.thumbnailUrl} alt="" />
                  <StatusIcon/>
                  <div className="span1">{item?.room?.name}</div>
                  <div className="span2">
                    <p className="p-1">
                      <MdPeopleAlt />
                      {item.reservationCount}/{item.maxSize}
                    </p>
                    <p className="p-1">
                      <MdCalendarToday />
                      {item.startDate ? moment.utc(item.startDate).local().locale(Language.getLanguage()).format("L LT") : `<${t('home.NOT_SET')}>`} {' (start)'}
                    </p>
                    <p className="p-1">
                      <MdCalendarToday />
                      {item.endDate ? moment.utc(item.endDate).local().locale(Language.getLanguage()).format("L LT") : `<${t('home.NOT_SET')}>`} {' (end)'}
                    </p>
                  </div>
                  <ActionButton/>
                </div>
              </>
            })}
          </>
        ) : (
          <></>
        )}
      </>
    );
  };

  const UIAuth = () => {
    const user = Store.getUser();
    if (user) {
      const ManagerBtn = () => {
        if (user.type >= 3) {
          return (
            <a className="manager" href="/?page=manager">
              {t('home.MANAGER')}
            </a>
          );
        } else {
          return <></>;
        }
      };
      return (
        <span className="display-name">
          <ManagerBtn />
          <span className="nameA"> {user.displayName || user.email} </span> |{" "}
          <a className="logout_btn" onClick={handleSignOut}>
           {t('home.SIGN_OUT')}
          </a>
        </span>
      );
    } else {
      return (
        <a href="/?page=signin" className="signin-up">
          {t('home.SIGN_IN')} / {t('home.SIGN_UP')}
        </a>
      );
    }
  };

  const openPopupNotification = exhibitionNoti => {
    if (exhibitionNoti) {
      setExhibitionNoti({
        name: exhibitionNoti?.room?.name,
        description: exhibitionNoti?.room?.description,
        sceneId: exhibitionNoti.sceneId,
        thumbnailUrl: exhibitionNoti?.room?.thumbnailUrl,
        startDate: moment(exhibitionNoti.startDate).format("YYYY-MM-DD hh:mma"),
        maxSize: exhibitionNoti.maxSize
      });
    } else {
      setExhibitionNoti(null);
    }
    setIsOpenNotification(true);
  };

  const closePopupNotification = () => {
    setIsOpenNotification(false);
  };

  if (isLoading) {
    return (
      <div className="loader-2">
        <div className="loader">
            <svg viewBox="0 0 80 80">
                <circle id="test" cx="40" cy="40" r="32"></circle>
            </svg>
        </div>
        <div className="loader triangle">
            <svg viewBox="0 0 86 80">
                <polygon points="43 8 79 72 7 72"></polygon>
            </svg>
        </div>
        <div className="loader">
            <svg viewBox="0 0 80 80">
                <rect x="8" y="8" width="64" height="64"></rect>
            </svg>
        </div>
      </div>
    );
  } else {
    return (
      <>
        {isOpen && (
          <Popup
            key={'popup-confirm-reservation'}
            size={"sm"}
            title={<>{t('home.POPUP_CONFIRM_RESERVATION__TITLE')}</>}
            content={
              <>
                <br />
                <div style={{textAlign: "center"}}>{t('home.POPUP_CONFIRM_RESERVATION__MESSAGE')}</div>
                <br />
              </>
            }
            actions={[
              {
                text: t('home.POPUP_CONFIRM_RESERVATION__YES'),
                class: "btn1",
                callback: () => {
                  handleReservate();
                }
              },
              {
                text: t('home.POPUP_CONFIRM_RESERVATION__CANCEL'),
                class: "btn2",
                callback: () => {
                  togglePopup();
                }
              }
            ]}
            handleClose={togglePopup}
          />
        )}

        {isOpenNotification && (
          <Popup
            key={'popup-exhibition-not-open-yet'}
            size={"lg"}
            title={<>{t('home.POPUP_EXHIBITION_NOT_OPEN_YET__TTILE')}</>}
            content={
              <>
                <div className="info-room">
                  <p className="noti-title">{t('home.POPUP_EXHIBITION_NOT_OPEN_YET__MESSAGE')}</p>
                </div>
              </>
            }
            actions={[
              {
                text: t('home.POPUP_EXHIBITION_NOT_OPEN_YET__CLOSE'),
                class: "btn2",
                callback: () => {
                  closePopupNotification();
                }
              }
            ]}
            handleClose={closePopupNotification}
          />
        )}

        <div className="background-homepage">
          <div className="row_1">
            <a href="/" style={{float: 'left', height: '100%'}}>
              <img src={logo} style={{height: '100%'}}/>
            </a>
            {/* <img src={LogoCompany}/> */}
            <UIAuth style={{float: 'right'}}/>
          </div>
          <div className="row_2">
            <div className="test">
              <div className="row" style={{margin: '5vh 0'}}>
              { user && (
                <a href="?page=profile">
                  <button style={{fontSize: '17px', color: '#149BF3', fontWeight: 'bold', padding: '5px 10px', border: '2px solid #1cbeff', borderRadius: '5px'}}>{t('home.PROFILE')}</button>
                </a>
              )}
              </div>
              <div className="tools">
                <div style={{float: 'left'}}>
                  <button className={isActiveSortASC ? "active" : ""} onClick={sortNewest}>
                    {t('home.NEWEST')}
                  </button>
                  <button className={isActiveSortDESC ? "active" : ""} onClick={sortOldest}>
                    {t('home.OLDEST')}
                  </button>
                </div>
                <div style={{float: 'right'}}>
                  <span> {t('home.LANGUAGE')} </span>
                  <select value={language} onChange={handleChangeLanguage}>
                    <option value="en">English</option>
                    <option value="ko">Korean</option>
                  </select>
                </div>
              </div>
              <div className="col">{renderExhibitions()}</div>
              <div className="">
                {exhibitionsLoaded ? (
                  exhibitions.data.length > 0 ? (
                    <Pagination pagination={exhibitions.pagination} callFetchList={changePages} />
                  ) : null
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}
