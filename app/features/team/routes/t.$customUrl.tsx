import type { MetaFunction, SerializeFrom } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import React from "react";
import { useTranslation } from "react-i18next";
import { Avatar } from "~/components/Avatar";
import { Button, LinkButton } from "~/components/Button";
import { Flag } from "~/components/Flag";
import { FormWithConfirm } from "~/components/FormWithConfirm";
import { WeaponImage } from "~/components/Image";
import { Main } from "~/components/Main";
import { SubmitButton } from "~/components/SubmitButton";
import { EditIcon } from "~/components/icons/Edit";
import { StarIcon } from "~/components/icons/Star";
import { TwitterIcon } from "~/components/icons/Twitter";
import { UsersIcon } from "~/components/icons/Users";
import { useUser } from "~/features/auth/core/user";
import { isAdmin } from "~/permissions";
import { removeDuplicates } from "~/utils/arrays";
import type { SendouRouteHandle } from "~/utils/remix";
import { makeTitle } from "~/utils/strings";
import {
	TEAM_SEARCH_PAGE,
	editTeamPage,
	manageTeamRosterPage,
	navIconUrl,
	teamPage,
	twitterUrl,
	userPage,
	userSubmittedImage,
} from "~/utils/urls";
import type * as TeamRepository from "../TeamRepository.server";
import { isTeamMember, isTeamOwner } from "../team-utils";

import { action } from "../actions/t.$customUrl.server";
import { loader } from "../loaders/t.$customUrl.server";
export { action, loader };

import "../team.css";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	if (!data) return [];

	return [
		{ title: makeTitle(data.team.name) },
		{ name: "description", content: data.team.bio },
	];
};

export const handle: SendouRouteHandle = {
	i18n: ["team"],
	breadcrumb: ({ match }) => {
		const data = match.data as SerializeFrom<typeof loader> | undefined;

		if (!data) return [];

		return [
			{
				imgPath: navIconUrl("t"),
				href: TEAM_SEARCH_PAGE,
				type: "IMAGE",
			},
			{
				text: data.team.name,
				href: teamPage(data.team.customUrl),
				type: "TEXT",
			},
		];
	},
};

export default function TeamPage() {
	const { team } = useLoaderData<typeof loader>();

	return (
		<Main className="stack lg">
			<div className="stack sm">
				<TeamBanner />
				{/* <InfoBadges /> */}
			</div>
			<MobileTeamNameCountry />
			<ActionButtons />
			{/* {team.results ? <ResultsBanner results={team.results} /> : null} */}
			{team.bio ? <article data-testid="team-bio">{team.bio}</article> : null}
			<div className="stack lg">
				{team.members.map((member, i) => (
					<React.Fragment key={member.discordId}>
						<MemberRow member={member} number={i} />
						<MobileMemberCard member={member} />
					</React.Fragment>
				))}
			</div>
		</Main>
	);
}

function TeamBanner() {
	const { team } = useLoaderData<typeof loader>();

	return (
		<>
			<div
				className={clsx("team__banner", {
					team__banner__placeholder: !team.bannerSrc,
				})}
				style={{
					"--team-banner-img": team.bannerSrc
						? `url("${userSubmittedImage(team.bannerSrc)}")`
						: undefined,
				}}
			>
				{team.avatarSrc ? (
					<div className="team__banner__avatar">
						<div>
							<img src={userSubmittedImage(team.avatarSrc)} alt="" />
						</div>
					</div>
				) : null}
				<div className="team__banner__flags">
					{removeDuplicates(
						team.members
							.map((member) => member.country)
							.filter((country) => country !== null),
					).map((country) => {
						return <Flag key={country} countryCode={country} />;
					})}
				</div>
				<div className="team__banner__name">
					{team.name} <TwitterLink testId="twitter-link" />
				</div>
			</div>
			{team.avatarSrc ? <div className="team__banner__avatar__spacer" /> : null}
		</>
	);
}

function MobileTeamNameCountry() {
	const { team } = useLoaderData<typeof loader>();

	return (
		<div className="team__mobile-name-country">
			<div className="stack horizontal sm">
				{removeDuplicates(
					team.members
						.map((member) => member.country)
						.filter((country) => country !== null),
				).map((country) => {
					return <Flag key={country} countryCode={country} tiny />;
				})}
			</div>
			<div className="team__mobile-team-name">
				{team.name}
				<TwitterLink />
			</div>
		</div>
	);
}

function TwitterLink({ testId }: { testId?: string }) {
	const { team } = useLoaderData<typeof loader>();

	if (!team.twitter) return null;

	return (
		<a
			className="team__twitter-link"
			href={twitterUrl(team.twitter)}
			target="_blank"
			rel="noreferrer"
			data-testid={testId}
		>
			<TwitterIcon />
		</a>
	);
}

function ActionButtons() {
	const { t } = useTranslation(["team"]);
	const user = useUser();
	const { team } = useLoaderData<typeof loader>();

	if (!isTeamMember({ user, team }) && !isAdmin(user)) {
		return null;
	}

	const isMainTeam = team.members.find(
		(member) => user?.id === member.id && member.isMainTeam,
	);

	return (
		<div className="team__action-buttons">
			{isTeamMember({ user, team }) && !isMainTeam ? (
				<ChangeMainTeamButton />
			) : null}
			{!isTeamOwner({ user, team }) && isTeamMember({ user, team }) ? (
				<FormWithConfirm
					dialogHeading={t("team:leaveTeam.header", { teamName: team.name })}
					deleteButtonText={t("team:actionButtons.leaveTeam.confirm")}
					fields={[["_action", "LEAVE_TEAM"]]}
				>
					<Button
						size="tiny"
						variant="destructive"
						data-testid="leave-team-button"
					>
						{t("team:actionButtons.leaveTeam")}
					</Button>
				</FormWithConfirm>
			) : null}
			{isTeamOwner({ user, team }) || isAdmin(user) ? (
				<LinkButton
					size="tiny"
					to={manageTeamRosterPage(team.customUrl)}
					variant="outlined"
					prefetch="intent"
					icon={<UsersIcon />}
					testId="manage-roster-button"
				>
					{t("team:actionButtons.manageRoster")}
				</LinkButton>
			) : null}
			{isTeamOwner({ user, team }) || isAdmin(user) ? (
				<LinkButton
					size="tiny"
					to={editTeamPage(team.customUrl)}
					variant="outlined"
					prefetch="intent"
					icon={<EditIcon />}
					testId="edit-team-button"
				>
					{t("team:actionButtons.editTeam")}
				</LinkButton>
			) : null}
		</div>
	);
}

function ChangeMainTeamButton() {
	const { t } = useTranslation(["team"]);
	const fetcher = useFetcher();

	return (
		<fetcher.Form method="post">
			<SubmitButton
				_action="MAKE_MAIN_TEAM"
				size="tiny"
				variant="outlined"
				icon={<StarIcon />}
				testId="make-main-team-button"
			>
				{t("team:actionButtons.makeMainTeam")}
			</SubmitButton>
		</fetcher.Form>
	);
}

// function ResultsBanner({ results }: { results: TeamResultPeek }) {
// 	return (
// 		<Link className="team__results" to="results">
// 			<div>View {results.count} results</div>
// 			<ul className="team__results__placements">
// 				{results.placements.map(({ placement, count }) => {
// 					return (
// 						<li key={placement}>
// 							<Placement placement={placement} />×{count}
// 						</li>
// 					);
// 				})}
// 			</ul>
// 		</Link>
// 	);
// }

function MemberRow({
	member,
	number,
}: {
	member: TeamRepository.findByCustomUrl["members"][number];
	number: number;
}) {
	const { t } = useTranslation(["team"]);

	return (
		<div
			className="team__member"
			data-testid={member.isOwner ? `member-owner-${member.id}` : undefined}
		>
			{member.role ? (
				<span
					className="team__member__role"
					data-testid={`member-row-role-${number}`}
				>
					{t(`team:roles.${member.role}`)}
				</span>
			) : null}
			<div className="team__member__section">
				<Link
					to={userPage(member)}
					className="team__member__avatar-name-container"
				>
					<div className="team__member__avatar">
						<Avatar user={member} size="md" />
					</div>
					{member.username}
				</Link>
				<div className="stack horizontal md">
					{member.weapons.map(({ weaponSplId, isFavorite }) => (
						<WeaponImage
							key={weaponSplId}
							variant={isFavorite ? "badge-5-star" : "badge"}
							weaponSplId={weaponSplId}
							width={48}
							height={48}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function MobileMemberCard({
	member,
}: { member: TeamRepository.findByCustomUrl["members"][number] }) {
	const { t } = useTranslation(["team"]);

	return (
		<div className="team__member-card__container">
			<div className="team__member-card">
				<Link to={userPage(member)} className="stack items-center">
					<Avatar user={member} size="md" />
					<div className="team__member-card__name">{member.username}</div>
				</Link>
				{member.weapons.length > 0 ? (
					<div className="stack horizontal md">
						{member.weapons.map(({ weaponSplId, isFavorite }) => (
							<WeaponImage
								key={weaponSplId}
								variant={isFavorite ? "badge-5-star" : "badge"}
								weaponSplId={weaponSplId}
								width={32}
								height={32}
							/>
						))}
					</div>
				) : null}
			</div>
			{member.role ? (
				<span className="team__member__role__mobile">
					{t(`team:roles.${member.role}`)}
				</span>
			) : null}
		</div>
	);
}
