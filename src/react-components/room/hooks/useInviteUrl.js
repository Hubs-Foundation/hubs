import { useCallback, useEffect, useMemo, useState } from "react";
import { hubUrl } from "../../../utils/phoenix-utils";

export function useInviteUrl(hubChannel, disabled = false) {
  const [inviteId, setInviteId] = useState();

  useEffect(() => {
    setInviteId(undefined);

    if (disabled) {
      return;
    }

    hubChannel
      .fetchInvite()
      .then(({ hub_invite_id }) => {
        if (disabled) {
          return;
        }

        setInviteId(hub_invite_id);
      })
      .catch(error => {
        console.error("Error fetching invite", error);
      });
  }, [hubChannel, disabled]);

  const revokeInvite = useCallback(() => {
    setInviteId(undefined);

    if (disabled) {
      return;
    }

    hubChannel
      .revokeInvite(inviteId)
      .then(({ hub_invite_id }) => {
        if (disabled) {
          return;
        }

        setInviteId(hub_invite_id);
      })
      .catch(error => {
        console.error("Error revoking invite", error);
      });
  }, [inviteId, hubChannel, disabled]);

  const inviteUrl = useMemo(() => {
    if (inviteId && !disabled) {
      const url = hubUrl();
      url.searchParams.set("hub_invite_id", inviteId);
      return url.toString();
    }

    return undefined;
  }, [inviteId, disabled]);

  const fetchingInvite = !inviteId && !disabled;

  return { fetchingInvite, inviteUrl, revokeInvite };
}
