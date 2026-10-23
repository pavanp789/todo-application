
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import api from "../api";
import { setUser, clearUser } from "../redux/authSlice";

function SessionCheck() {
  const dispatch = useDispatch();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    api.get("/auth/me")
      .then((response) => {
        if (active) {
          dispatch(setUser(response.data.user));
        }
      })
      .catch(() => {
        if (active) {
          dispatch(clearUser());
        }
      })
      .finally(() => {
        if (active) {
          setChecking(false);
        }
      });

    return () => {
      active = false;
    };
  }, [dispatch]);

  return (
    <div
      style={{ display: "none" }}
      data-session-checking={checking}
    />
  );
}

export default SessionCheck;
