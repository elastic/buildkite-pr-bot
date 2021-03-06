import { Octokit } from '@octokit/rest';
import { PrConfig } from './models/prConfig';

const appConfig = require(process.env.APP_CONFIG || './defaultConfig.js');

export const getRepoConfig = (repoOwner: string, repoName: string, config = appConfig) => {
  return config.repos.find((repo) => repo.owner === repoOwner && repo.repo === repoName);
};

// TODO error scenarios etc
export default async function getConfigs(repoOwner: string, repoName: string, github: Octokit, config = appConfig) {
  const repoConfig = getRepoConfig(repoOwner, repoName, config);

  if (!repoConfig) {
    return null;
  }

  const contents = await github.repos.getContent({
    owner: repoConfig.configOwner || repoConfig.owner,
    repo: repoConfig.configRepo || repoConfig.repo,
    ref: repoConfig.configBranch || 'master',
    path: repoConfig.configPath || '.ci/pull-requests.json',
  });

  const json = Buffer.from(contents.data.content, 'base64').toString();
  const parsed = JSON.parse(json);

  if (parsed?.jobs) {
    return parsed.jobs.map((job) => new PrConfig(job));
  }
}
